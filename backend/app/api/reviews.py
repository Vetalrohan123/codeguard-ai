from __future__ import annotations

import re
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.core.rate_limit import limiter
from app.database import AsyncSessionLocal, get_db
from app.models.analysis_job import AnalysisJob
from app.models.github_account import GitHubAccount
from app.models.pull_request import PullRequest
from app.models.repository import Repository
from app.models.review import Review
from app.models.review_finding import ReviewFinding
from app.models.user import User
from app.schemas.context_budget import (
    ContextBudgetResponse,
    ContextFileBudgetResponse,
    ContextPriorityResponse,
    ReviewContextBudgetResponse,
)
from app.schemas.review import (
    ReviewFindingResponse,
    ReviewResponse,
    ReviewRunResponse,
)
from app.schemas.review_job import ReviewJobResponse
from app.services.analysis_job_service import AnalysisJobService
from app.services.github_service import GitHubService
from app.services.review_pipeline import (
    PipelineFile,
    ReviewPipeline,
)
from app.workers.review_tasks import run_review_task


router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"],
)


# ============================================================
# DATABASE HELPERS
# ============================================================


async def get_user_pull_request(
    db: AsyncSession,
    pull_request_id: int,
    user_id: int,
) -> PullRequest:
    """
    Get a pull request belonging to the authenticated user.
    """
    result = await db.execute(
        select(PullRequest)
        .join(
            Repository,
            PullRequest.repository_id == Repository.id,
        )
        .where(
            PullRequest.id == pull_request_id,
            Repository.user_id == user_id,
        )
    )

    pull_request = result.scalar_one_or_none()

    if pull_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pull request not found",
        )

    return pull_request


async def get_user_github_account(
    db: AsyncSession,
    user_id: int,
) -> GitHubAccount:
    """
    Get the authenticated user's connected GitHub account.
    """
    result = await db.execute(
        select(GitHubAccount).where(
            GitHubAccount.user_id == user_id,
        )
    )

    account = result.scalar_one_or_none()

    if account is None or not account.access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="GitHub account is not connected",
        )

    return account


async def get_repository(
    db: AsyncSession,
    repository_id: int,
    user_id: int,
) -> Repository:
    """
    Get a repository belonging to the authenticated user.
    """
    result = await db.execute(
        select(Repository).where(
            Repository.id == repository_id,
            Repository.user_id == user_id,
        )
    )

    repository = result.scalar_one_or_none()

    if repository is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found",
        )

    return repository


# ============================================================
# FILE HELPERS
# ============================================================


def is_reviewable_file(
    github_file: dict,
) -> bool:
    """
    Determine whether a GitHub PR file can be reviewed.

    Deleted files are skipped because their source content
    does not exist at the PR HEAD.
    """
    filename = github_file.get("filename")

    if not filename:
        return False

    status_value = github_file.get("status")

    if status_value == "removed":
        return False

    if (
        github_file.get("patch") is None
        and status_value
        not in {
            "added",
            "modified",
            "renamed",
            "copied",
        }
    ):
        return False

    return True


# ============================================================
# GITHUB ERROR HELPERS
# ============================================================


def raise_github_http_error(
    error: httpx.HTTPStatusError,
    default_detail: str = "GitHub API request failed.",
) -> None:
    """
    Convert GitHub HTTP errors into FastAPI errors.
    """
    response = error.response

    if response.status_code == 401:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "GitHub authorization has expired. "
                "Please reconnect GitHub."
            ),
        ) from error

    if response.status_code == 403:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "GitHub denied access to the "
                "requested resource."
            ),
        ) from error

    if response.status_code == 404:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="GitHub resource was not found.",
        ) from error

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=default_detail,
    ) from error


# ============================================================
# REVIEW HELPERS
# ============================================================


def build_review_summary(
    *,
    files_analyzed: int,
    files_failed: int,
    findings_count: int,
    ai_findings_count: int,
    static_findings_count: int,
    skipped_files_count: int,
    status_value: str,
    static_failed: bool,
    ai_failed: bool,
) -> str:
    """
    Build a consistent review summary for the API/UI.
    """
    if ai_failed:
        summary = (
            "AI review failed. "
            f"{files_analyzed} files were analyzed and "
            f"{files_failed} files failed analysis. "
            "Static analysis produced "
            f"{static_findings_count} findings."
        )

    elif status_value == "partial":
        summary = (
            f"Analyzed {files_analyzed} files, "
            f"{files_failed} files failed, "
            f"and found {findings_count} issues "
            f"({ai_findings_count} AI, "
            f"{static_findings_count} static)."
        )

    elif static_failed:
        summary = (
            f"Analyzed {files_analyzed} files "
            f"and found {findings_count} issues "
            f"({ai_findings_count} AI, "
            f"{static_findings_count} static). "
            "Static analysis was partially unavailable."
        )

    else:
        summary = (
            f"Analyzed {files_analyzed} files "
            f"and found {findings_count} issues "
            f"({ai_findings_count} AI, "
            f"{static_findings_count} static)."
        )

    if skipped_files_count > 0:
        summary += (
            f" Skipped {skipped_files_count} files."
        )

    return summary


# ============================================================
# CONTEXT BUDGET DESERIALIZATION
# ============================================================


def build_persisted_context_budget_response(
    context_budget: dict | None,
) -> ReviewContextBudgetResponse | None:
    """
    Convert persisted Review.context_budget JSONB into the
    public ReviewContextBudgetResponse schema.

    This is used for persisted/Celery reviews where the original
    BudgetResult and FilePriority Python objects no longer exist.
    """
    if not context_budget:
        return None

    try:
        raw_priorities = (
            context_budget.get("priorities")
            or []
        )

        raw_budgets = (
            context_budget.get("budgets")
            or {}
        )

        priorities: list[
            ContextPriorityResponse
        ] = []

        for item in raw_priorities:
            if not isinstance(item, dict):
                continue

            priorities.append(
                ContextPriorityResponse(
                    path=str(
                        item.get(
                            "path",
                            "",
                        )
                    ),
                    score=float(
                        item.get(
                            "score",
                            0.0,
                        )
                    ),
                    tier=str(
                        item.get(
                            "tier",
                            "",
                        )
                    ),
                    import_score=float(
                        item.get(
                            "import_score",
                            0.0,
                        )
                    ),
                    static_finding_score=float(
                        item.get(
                            "static_finding_score",
                            0.0,
                        )
                    ),
                    size_score=float(
                        item.get(
                            "size_score",
                            0.0,
                        )
                    ),
                    language_score=float(
                        item.get(
                            "language_score",
                            0.0,
                        )
                    ),
                    dependency_score=float(
                        item.get(
                            "dependency_score",
                            0.0,
                        )
                    ),
                    reason=str(
                        item.get(
                            "reason",
                            "",
                        )
                    ),
                )
            )

        budgets: dict[
            str,
            ContextBudgetResponse,
        ] = {}

        for budget_key, raw_budget in raw_budgets.items():
            if not isinstance(raw_budget, dict):
                continue

            raw_current = (
                raw_budget.get(
                    "current_file"
                )
                or {}
            )

            current_file = ContextFileBudgetResponse(
                path=str(
                    raw_current.get(
                        "path",
                        "",
                    )
                ),
                language=str(
                    raw_current.get(
                        "language",
                        "",
                    )
                ),
                characters=int(
                    raw_current.get(
                        "characters",
                        0,
                    )
                ),
                estimated_tokens=int(
                    raw_current.get(
                        "estimated_tokens",
                        0,
                    )
                ),
                original_characters=int(
                    raw_current.get(
                        "original_characters",
                        0,
                    )
                ),
                truncated=bool(
                    raw_current.get(
                        "truncated",
                        False,
                    )
                ),
            )

            related_files: list[
                ContextFileBudgetResponse
            ] = []

            raw_related = (
                raw_budget.get(
                    "related_files"
                )
                or []
            )

            for raw_file in raw_related:
                if not isinstance(
                    raw_file,
                    dict,
                ):
                    continue

                related_files.append(
                    ContextFileBudgetResponse(
                        path=str(
                            raw_file.get(
                                "path",
                                "",
                            )
                        ),
                        language=str(
                            raw_file.get(
                                "language",
                                "",
                            )
                        ),
                        characters=int(
                            raw_file.get(
                                "characters",
                                0,
                            )
                        ),
                        estimated_tokens=int(
                            raw_file.get(
                                "estimated_tokens",
                                0,
                            )
                        ),
                        original_characters=int(
                            raw_file.get(
                                "original_characters",
                                0,
                            )
                        ),
                        truncated=bool(
                            raw_file.get(
                                "truncated",
                                False,
                            )
                        ),
                    )
                )

            raw_dropped = (
                raw_budget.get(
                    "files_dropped"
                )
                or []
            )

            files_dropped = [
                str(path)
                for path in raw_dropped
            ]

            budgets[str(budget_key)] = (
                ContextBudgetResponse(
                    current_file=current_file,
                    related_files=related_files,
                    total_characters=int(
                        raw_budget.get(
                            "total_characters",
                            0,
                        )
                    ),
                    total_estimated_tokens=int(
                        raw_budget.get(
                            "total_estimated_tokens",
                            0,
                        )
                    ),
                    files_dropped=files_dropped,
                )
            )

        total_characters = int(
            context_budget.get(
                "total_characters",
                0,
            )
        )

        total_estimated_tokens = int(
            context_budget.get(
                "total_estimated_tokens",
                0,
            )
        )

        files_included = int(
            context_budget.get(
                "files_included",
                0,
            )
        )

        files_dropped = int(
            context_budget.get(
                "files_dropped",
                0,
            )
        )

        files_truncated = int(
            context_budget.get(
                "files_truncated",
                0,
            )
        )

        return ReviewContextBudgetResponse(
            total_characters=max(
                0,
                total_characters,
            ),
            total_estimated_tokens=max(
                0,
                total_estimated_tokens,
            ),
            files_included=max(
                0,
                files_included,
            ),
            files_dropped=max(
                0,
                files_dropped,
            ),
            files_truncated=max(
                0,
                files_truncated,
            ),
            priorities=priorities,
            budgets=budgets,
        )

    except Exception:
        # A malformed historical JSONB value should not make
        # the entire review endpoint unavailable.
        return None


# ============================================================
# REVIEW JOB RESPONSE HELPER
# ============================================================


def build_review_job_response(
    job: AnalysisJob,
) -> ReviewJobResponse:
    """
    Convert the database AnalysisJob model into the public
    ReviewJobResponse schema.
    """
    return ReviewJobResponse(
        job_id=job.id,
        review_id=job.review_id,
        repository_id=job.repository_id,
        status=job.status,
        error=job.error,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


# ============================================================
# RUN CODE REVIEW - EXISTING SYNCHRONOUS ENDPOINT
# ============================================================


@router.post(
    "/{pull_request_id}/run",
    response_model=ReviewRunResponse,
)
@limiter.limit("5/minute")
async def run_review(
    request: Request,
    pull_request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReviewRunResponse:
    """
    Run CodeGuard AI + static analysis for a pull request.

    This is the synchronous review endpoint.

    The API route owns commit/rollback.
    """

    # ========================================================
    # 1. Get user's pull request
    # ========================================================

    pull_request = await get_user_pull_request(
        db=db,
        pull_request_id=pull_request_id,
        user_id=current_user.id,
    )

    # ========================================================
    # 2. Get repository
    # ========================================================

    repository = await get_repository(
        db=db,
        repository_id=pull_request.repository_id,
        user_id=current_user.id,
    )

    # ========================================================
    # 3. Get connected GitHub account
    # ========================================================

    github_account = await get_user_github_account(
        db=db,
        user_id=current_user.id,
    )

    if repository.github_account_id != github_account.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Repository is not linked to the "
                "connected GitHub account."
            ),
        )

    github_service = GitHubService(
        github_account.access_token,
    )

    # ========================================================
    # 4. Get current GitHub PR
    # ========================================================

    try:
        pull_request_data = (
            await github_service.get_pull_request(
                owner=repository.owner,
                repo=repository.name,
                pull_number=pull_request.number,
            )
        )

    except httpx.HTTPStatusError as error:
        raise_github_http_error(
            error,
            default_detail=(
                "GitHub API request failed while "
                "loading the pull request."
            ),
        )

    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to connect to GitHub.",
        ) from error

    head = pull_request_data.get("head") or {}
    head_sha = head.get("sha")

    if not head_sha:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=(
                "GitHub did not return a HEAD commit SHA "
                "for this pull request."
            ),
        )

    # ========================================================
    # 5. Get changed files
    # ========================================================

    try:
        changed_files = (
            await github_service.get_pull_request_files(
                owner=repository.owner,
                repo=repository.name,
                pull_number=pull_request.number,
                page=1,
                per_page=100,
            )
        )

    except httpx.HTTPStatusError as error:
        raise_github_http_error(
            error,
            default_detail=(
                "GitHub API request failed while "
                "loading pull request files."
            ),
        )

    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to connect to GitHub.",
        ) from error

    if not changed_files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Pull request contains no changed files."
            ),
        )

    # ========================================================
    # 6. Fetch full source code at PR HEAD
    # ========================================================

    pipeline_files: list[PipelineFile] = []
    skipped_files: list[str] = []

    for github_file in changed_files:
        if not is_reviewable_file(github_file):
            filename = github_file.get("filename")

            if filename:
                skipped_files.append(filename)

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
            if error.response.status_code == 404:
                skipped_files.append(filename)
                continue

            if error.response.status_code == 401:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=(
                        "GitHub authorization has expired. "
                        "Please reconnect GitHub."
                    ),
                ) from error

            if error.response.status_code == 403:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        "GitHub denied access to "
                        "repository files."
                    ),
                ) from error

            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=(
                    "Failed to fetch source file: "
                    f"{filename}"
                ),
            ) from error

        except (
            httpx.HTTPError,
            ValueError,
            UnicodeDecodeError,
        ):
            skipped_files.append(filename)
            continue

        if not source_code.strip():
            skipped_files.append(filename)
            continue

        pipeline_files.append(
            PipelineFile(
                path=filename,
                content=source_code,
            )
        )

    # ========================================================
    # 7. Make sure there is code to review
    # ========================================================

    if not pipeline_files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "No reviewable source files were found "
                "in the pull request."
            ),
        )

    # ========================================================
    # 8. Create review record
    # ========================================================

    now = datetime.now(timezone.utc)

    review = Review(
        repository_id=repository.id,
        pull_request_id=pull_request.id,
        score=0,
        status="running",
        summary=None,
        context_budget=None,
        created_at=now,
        updated_at=now,
    )

    db.add(review)

    result = None

    try:
        # ====================================================
        # 9. Flush review
        # ====================================================

        await db.flush()

        # ====================================================
        # 10. Run complete review pipeline
        # ====================================================

        pipeline = ReviewPipeline()

        result = await pipeline.run(
            db=db,
            review_id=review.id,
            files=pipeline_files,
        )

        # ====================================================
        # 11. Extract statistics
        # ====================================================

        files_analyzed = result.files_analyzed
        files_failed = result.files_failed
        findings_count = len(result.findings)

        static_findings_count = (
            result.static_findings
        )

        ai_findings_count = (
            result.ai_findings
        )

        static_failed = result.static_failed
        ai_failed = result.ai_failed

        # ====================================================
        # 12. Determine final status
        # ====================================================

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

        # ====================================================
        # 13. Protect against invalid successful states
        # ====================================================

        if (
            final_status == "completed"
            and files_analyzed == 0
        ):
            final_status = "failed"

        if (
            final_status == "failed"
            and files_analyzed == 0
        ):
            review.score = 0.0

        else:
            review.score = result.score

        # ====================================================
        # 14. Build final summary
        # ====================================================

        review.status = final_status

        review.summary = build_review_summary(
            files_analyzed=files_analyzed,
            files_failed=files_failed,
            findings_count=findings_count,
            ai_findings_count=ai_findings_count,
            static_findings_count=static_findings_count,
            skipped_files_count=len(skipped_files),
            status_value=final_status,
            static_failed=static_failed,
            ai_failed=ai_failed,
        )

        # ====================================================
        # 15. Update timestamp
        # ====================================================

        review.updated_at = datetime.now(
            timezone.utc
        )

        # ====================================================
        # 16. Commit exactly once
        # ====================================================

        await db.commit()
        await db.refresh(review)

    except HTTPException:
        await db.rollback()
        raise

    except Exception as error:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete code review.",
        ) from error

    # ========================================================
    # 17. Safety check
    # ========================================================

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Review pipeline returned no result.",
        )

    # ========================================================
    # 18. Get persisted findings
    # ========================================================

    finding_result = await db.execute(
        select(ReviewFinding)
        .where(
            ReviewFinding.review_id == review.id,
        )
        .order_by(
            ReviewFinding.line.asc(),
            ReviewFinding.id.asc(),
        )
    )

    findings = list(
        finding_result.scalars().all()
    )

    # ========================================================
    # 19. Build context budget response
    # ========================================================

    context_budget = (
        build_persisted_context_budget_response(
            review.context_budget
        )
    )

    # ========================================================
    # 20. Return complete review response
    # ========================================================

    return ReviewRunResponse(
        review=ReviewResponse.model_validate(
            review
        ),
        findings=[
            ReviewFindingResponse.model_validate(
                finding
            )
            for finding in findings
        ],
        files_analyzed=result.files_analyzed,
        files_failed=result.files_failed,
        static_findings=result.static_findings,
        ai_findings=result.ai_findings,
        context_budget=context_budget,
    )


# ============================================================
# RUN CODE REVIEW - ASYNC / CELERY
# ============================================================


@router.post(
    "/{pull_request_id}/run-async",
    response_model=ReviewJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
@limiter.limit("10/minute")
async def run_review_async(
    request: Request,
    pull_request_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReviewJobResponse:
    """
    Queue a CodeGuard review for background execution.
    """

    # ========================================================
    # 1. Validate pull request ownership
    # ========================================================

    pull_request = await get_user_pull_request(
        db=db,
        pull_request_id=pull_request_id,
        user_id=current_user.id,
    )

    # ========================================================
    # 2. Validate repository ownership
    # ========================================================

    repository = await get_repository(
        db=db,
        repository_id=pull_request.repository_id,
        user_id=current_user.id,
    )

    # ========================================================
    # 3. Validate GitHub account
    # ========================================================

    github_account = await get_user_github_account(
        db=db,
        user_id=current_user.id,
    )

    if repository.github_account_id != github_account.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Repository is not linked to the "
                "connected GitHub account."
            ),
        )

    # ========================================================
    # 4. Create Review
    # ========================================================

    now = datetime.now(timezone.utc)

    review = Review(
        repository_id=repository.id,
        pull_request_id=pull_request.id,
        score=0,
        status="queued",
        summary=None,
        context_budget=None,
        created_at=now,
        updated_at=now,
    )

    db.add(review)

    try:
        # ====================================================
        # 5. Flush Review
        # ====================================================

        await db.flush()

        # ====================================================
        # 6. Create AnalysisJob
        # ====================================================

        job = await AnalysisJobService.create_job(
            db=db,
            review_id=review.id,
            repository_id=repository.id,
        )

        # ====================================================
        # 7. Commit before enqueue
        # ====================================================

        await db.commit()
        await db.refresh(job)

    except Exception as error:
        await db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create review job.",
        ) from error

    # ========================================================
    # 8. Queue Celery task
    # ========================================================

    try:
        run_review_task.delay(job.id)

    except Exception as error:
        async with AsyncSessionLocal() as error_db:
            job_result = await error_db.execute(
                select(AnalysisJob).where(
                    AnalysisJob.id == job.id
                )
            )

            failed_job = (
                job_result.scalar_one_or_none()
            )

            if failed_job is not None:
                await AnalysisJobService.mark_failed(
                    db=error_db,
                    job=failed_job,
                    error_message=(
                        "Failed to enqueue Celery task: "
                        f"{error}"
                    ),
                )

                review_result = await error_db.execute(
                    select(Review).where(
                        Review.id == review.id
                    )
                )

                failed_review = (
                    review_result.scalar_one_or_none()
                )

                if failed_review is not None:
                    failed_review.status = "failed"
                    failed_review.score = 0
                    failed_review.summary = (
                        "Review could not be queued "
                        "for background execution."
                    )
                    failed_review.updated_at = (
                        datetime.now(timezone.utc)
                    )

                await error_db.commit()

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Review could not be queued. "
                "Please try again."
            ),
        ) from error

    # ========================================================
    # 9. Return queued job
    # ========================================================

    return build_review_job_response(job)


# ============================================================
# GET ASYNC REVIEW JOB STATUS
#
# IMPORTANT:
# This route must be declared BEFORE "/{review_id}"
# ============================================================


@router.get(
    "/jobs/{job_id}",
    response_model=ReviewJobResponse,
)
async def get_review_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReviewJobResponse:
    """
    Get the current status of a background review job.
    """

    result = await db.execute(
        select(AnalysisJob).where(
            AnalysisJob.id == job_id
        )
    )

    job = result.scalar_one_or_none()

    if job is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review job not found.",
        )

    repository_result = await db.execute(
        select(Repository).where(
            Repository.id == job.repository_id
        )
    )

    repository = (
        repository_result.scalar_one_or_none()
    )

    if repository is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found.",
        )

    if repository.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot access this review job.",
        )

    return build_review_job_response(job)


# ============================================================
# GET PERSISTED REVIEW RESULT
# ============================================================


@router.get(
    "/{review_id}",
    response_model=ReviewRunResponse,
)
async def get_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReviewRunResponse:
    """
    Get a persisted CodeGuard review result.

    Used by the frontend after a Celery review job reaches
    the completed state.
    """

    # ========================================================
    # 1. Load review
    # ========================================================

    review_result = await db.execute(
        select(Review).where(
            Review.id == review_id,
        )
    )

    review = review_result.scalar_one_or_none()

    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found.",
        )

    # ========================================================
    # 2. Validate repository ownership
    # ========================================================

    repository_result = await db.execute(
        select(Repository).where(
            Repository.id == review.repository_id,
        )
    )

    repository = (
        repository_result.scalar_one_or_none()
    )

    if repository is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found.",
        )

    if repository.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot access this review.",
        )

    # ========================================================
    # 3. Load persisted findings
    # ========================================================

    finding_result = await db.execute(
        select(ReviewFinding)
        .where(
            ReviewFinding.review_id == review.id,
        )
        .order_by(
            ReviewFinding.line.asc(),
            ReviewFinding.id.asc(),
        )
    )

    findings = list(
        finding_result.scalars().all()
    )

    # ========================================================
    # 4. Recover statistics from persisted summary
    # ========================================================

    summary = review.summary or ""

    files_analyzed = 0
    files_failed = 0
    ai_findings = 0
    static_findings = 0

    analyzed_match = re.search(
        r"Analyzed\s+(\d+)\s+files?",
        summary,
        re.IGNORECASE,
    )

    failed_match = re.search(
        r"(\d+)\s+files?\s+failed",
        summary,
        re.IGNORECASE,
    )

    findings_match = re.search(
        r"\((\d+)\s+AI,\s*(\d+)\s+static\)",
        summary,
        re.IGNORECASE,
    )

    if analyzed_match:
        files_analyzed = int(
            analyzed_match.group(1)
        )

    if failed_match:
        files_failed = int(
            failed_match.group(1)
        )

    if findings_match:
        ai_findings = int(
            findings_match.group(1)
        )

        static_findings = int(
            findings_match.group(2)
        )

    # ========================================================
    # 5. Deserialize persisted context budget
    # ========================================================

    context_budget = (
        build_persisted_context_budget_response(
            review.context_budget
        )
    )

    # ========================================================
    # 6. Return persisted result
    # ========================================================

    return ReviewRunResponse(
        review=ReviewResponse.model_validate(
            review
        ),
        findings=[
            ReviewFindingResponse.model_validate(
                finding
            )
            for finding in findings
        ],
        files_analyzed=files_analyzed,
        files_failed=files_failed,
        static_findings=static_findings,
        ai_findings=ai_findings,
        context_budget=context_budget,
    )
