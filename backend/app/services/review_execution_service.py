from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analysis_job import AnalysisJob
from app.models.github_account import GitHubAccount
from app.models.pull_request import PullRequest
from app.models.repository import Repository
from app.models.review import Review
from app.services.analysis_job_service import AnalysisJobService
from app.services.github_service import GitHubService
from app.services.review_pipeline import PipelineFile, ReviewPipeline
from app.services.review_helpers import (
    build_review_summary,
    is_reviewable_file,
)

logger = logging.getLogger(__name__)


@dataclass
class ReviewExecutionResult:
    review_id: int
    job_id: int
    status: str
    score: float
    files_analyzed: int
    files_failed: int
    findings_count: int
    static_findings: int
    ai_findings: int


class ReviewExecutionService:
    """
    Executes an existing AnalysisJob.

    The worker only needs the AnalysisJob ID. Everything else is
    reconstructed from PostgreSQL and GitHub.
    """

    @staticmethod
    async def execute_job(
        db: AsyncSession,
        job_id: int,
    ) -> ReviewExecutionResult:

        # ====================================================
        # 1. Load AnalysisJob
        # ====================================================

        result = await db.execute(
            select(AnalysisJob).where(
                AnalysisJob.id == job_id
            )
        )

        job = result.scalar_one_or_none()

        if job is None:
            raise ValueError(
                f"Analysis job {job_id} was not found."
            )

        # ====================================================
        # 2. Load Review
        # ====================================================

        result = await db.execute(
            select(Review).where(
                Review.id == job.review_id
            )
        )

        review = result.scalar_one_or_none()

        if review is None:
            raise ValueError(
                f"Review {job.review_id} was not found."
            )

        # ====================================================
        # 3. Load Pull Request
        # ====================================================

        if review.pull_request_id is None:
            raise ValueError(
                f"Review {review.id} has no pull request."
            )

        result = await db.execute(
            select(PullRequest).where(
                PullRequest.id
                == review.pull_request_id
            )
        )

        pull_request = result.scalar_one_or_none()

        if pull_request is None:
            raise ValueError(
                f"Pull request "
                f"{review.pull_request_id} was not found."
            )

        # ====================================================
        # 4. Load Repository
        # ====================================================

        result = await db.execute(
            select(Repository).where(
                Repository.id
                == review.repository_id
            )
        )

        repository = result.scalar_one_or_none()

        if repository is None:
            raise ValueError(
                f"Repository "
                f"{review.repository_id} was not found."
            )

        # ====================================================
        # 5. Load GitHub account
        # ====================================================

        if repository.github_account_id is None:
            raise ValueError(
                "Repository is not linked to a GitHub account."
            )

        result = await db.execute(
            select(GitHubAccount).where(
                GitHubAccount.id
                == repository.github_account_id
            )
        )

        github_account = result.scalar_one_or_none()

        if github_account is None:
            raise ValueError(
                "GitHub account linked to repository "
                "was not found."
            )

        logger.info(
            "Executing CodeGuard review | "
            "job_id=%s | review_id=%s | "
            "repository_id=%s | pr=%s",
            job.id,
            review.id,
            repository.id,
            pull_request.number,
        )

        # ====================================================
        # 6. Mark job/review running
        # ====================================================

        await AnalysisJobService.mark_running(
            db=db,
            job=job,
        )

        review.status = "running"
        review.updated_at = datetime.now(
            timezone.utc
        )

        await db.commit()

        # ====================================================
        # 7. GitHub service
        # ====================================================

        github_service = GitHubService(
            github_account.access_token
        )

        try:

            # =================================================
            # 8. Get current PR from GitHub
            # =================================================

            github_pr = await github_service.get_pull_request(
                owner=repository.owner,
                repo=repository.name,
                pull_number=pull_request.number,
            )

            head_sha = github_pr["head"]["sha"]

            # =================================================
            # 9. Get changed files
            # =================================================

            changed_files = []

            page = 1

            while True:

                page_files = (
                    await github_service.get_pull_request_files(
                        owner=repository.owner,
                        repo=repository.name,
                        pull_number=pull_request.number,
                        page=page,
                        per_page=100,
                    )
                )

                if not page_files:
                    break

                changed_files.extend(
                    page_files
                )

                if len(page_files) < 100:
                    break

                page += 1

            if not changed_files:
                raise ValueError(
                    "Pull request contains no changed files."
                )

            # =================================================
            # 10. Fetch source files
            # =================================================

            pipeline_files: list[PipelineFile] = []

            skipped_files: list[str] = []

            for github_file in changed_files:

                if not is_reviewable_file(
                    github_file
                ):
                    filename = github_file.get(
                        "filename"
                    )

                    if filename:
                        skipped_files.append(
                            filename
                        )

                    continue

                filename = github_file["filename"]

                try:

                    source_code = (
                        await github_service.get_file_content(
                            owner=repository.owner,
                            repo=repository.name,
                            path=filename,
                            ref=head_sha,
                        )
                    )

                except httpx.HTTPStatusError as error:

                    if (
                        error.response.status_code
                        == 404
                    ):
                        skipped_files.append(
                            filename
                        )
                        continue

                    if (
                        error.response.status_code
                        == 401
                    ):
                        raise ValueError(
                            "GitHub authorization has expired."
                        ) from error

                    if (
                        error.response.status_code
                        == 403
                    ):
                        raise ValueError(
                            "GitHub denied access to "
                            "repository files."
                        ) from error

                    raise ValueError(
                        f"Failed to fetch source file: "
                        f"{filename}"
                    ) from error

                except (
                    httpx.HTTPError,
                    ValueError,
                    UnicodeDecodeError,
                ):
                    skipped_files.append(
                        filename
                    )
                    continue

                if not source_code.strip():
                    skipped_files.append(
                        filename
                    )
                    continue

                pipeline_files.append(
                    PipelineFile(
                        path=filename,
                        content=source_code,
                    )
                )

            # =================================================
            # 11. Validate reviewable source
            # =================================================

            if not pipeline_files:
                raise ValueError(
                    "No reviewable source files were found "
                    "in the pull request."
                )

            # =================================================
            # 12. Execute ReviewPipeline
            # =================================================

            pipeline = ReviewPipeline()

            pipeline_result = (
                await pipeline.run(
                    db=db,
                    review_id=review.id,
                    files=pipeline_files,
                )
            )

            # =================================================
            # 13. Extract statistics
            # =================================================

            files_analyzed = (
                pipeline_result.files_analyzed
            )

            files_failed = (
                pipeline_result.files_failed
            )

            findings_count = len(
                pipeline_result.findings
            )

            static_findings = (
                pipeline_result.static_findings
            )

            ai_findings = (
                pipeline_result.ai_findings
            )

            static_failed = (
                pipeline_result.static_failed
            )

            ai_failed = (
                pipeline_result.ai_failed
            )

            # =================================================
            # 14. Determine final status
            # =================================================

            if ai_failed:
                final_status = "failed"

            elif (
                files_analyzed > 0
                and files_failed > 0
            ):
                final_status = "partial"

            elif files_analyzed > 0:
                final_status = "completed"

            else:
                final_status = "failed"

            if (
                final_status == "completed"
                and files_analyzed == 0
            ):
                final_status = "failed"

            if (
                final_status == "failed"
                and files_analyzed == 0
            ):
                review.score = 0
            else:
                review.score = pipeline_result.score

            # =================================================
            # 15. Update Review
            # =================================================

            review.status = final_status

            review.summary = build_review_summary(
                files_analyzed=files_analyzed,
                files_failed=files_failed,
                findings_count=findings_count,
                ai_findings_count=ai_findings,
                static_findings_count=static_findings,
                skipped_files_count=len(
                    skipped_files
                ),
                status_value=final_status,
                static_failed=static_failed,
                ai_failed=ai_failed,
            )

            review.updated_at = datetime.now(
                timezone.utc
            )

            # =================================================
            # 16. Complete AnalysisJob
            # =================================================

            await AnalysisJobService.mark_completed(
                db=db,
                job=job,
            )

            await db.commit()

            logger.info(
                "CodeGuard review completed | "
                "job_id=%s | review_id=%s | "
                "status=%s | score=%s",
                job.id,
                review.id,
                final_status,
                review.score,
            )

            return ReviewExecutionResult(
                review_id=review.id,
                job_id=job.id,
                status=final_status,
                score=float(review.score or 0),
                files_analyzed=files_analyzed,
                files_failed=files_failed,
                findings_count=findings_count,
                static_findings=static_findings,
                ai_findings=ai_findings,
            )

        except Exception as error:

            await db.rollback()

            logger.exception(
                "CodeGuard review failed | "
                "job_id=%s | review_id=%s",
                job_id,
                review.id,
            )

            # -----------------------------------------------
            # Persist failure using a fresh transaction
            # -----------------------------------------------

            result = await db.execute(
                select(Review).where(
                    Review.id == review.id
                )
            )

            failed_review = (
                result.scalar_one_or_none()
            )

            if failed_review is not None:
                failed_review.status = "failed"
                failed_review.score = 0
                failed_review.summary = (
                    "Code review failed before "
                    "completion."
                )
                failed_review.updated_at = (
                    datetime.now(timezone.utc)
                )

            result = await db.execute(
                select(AnalysisJob).where(
                    AnalysisJob.id == job_id
                )
            )

            failed_job = (
                result.scalar_one_or_none()
            )

            if failed_job is not None:
                await AnalysisJobService.mark_failed(
                    db=db,
                    job=failed_job,
                    error_message=str(error),
                )

            await db.commit()

            raise