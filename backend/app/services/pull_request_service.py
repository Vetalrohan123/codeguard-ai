from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pull_request import PullRequest
from app.models.repository import Repository
from app.services.github_service import GitHubService


class PullRequestService:

    @staticmethod
    async def sync_repository_pull_requests(
        db: AsyncSession,
        repository: Repository,
        github_service: GitHubService,
        state: str = "open",
    ) -> list[PullRequest]:

        pull_requests = await github_service.get_pull_requests(
            owner=repository.owner,
            repo=repository.name,
            state=state,
            page=1,
            per_page=100,
        )

        synced: list[PullRequest] = []

        for github_pr in pull_requests:
            github_pr_id = str(github_pr["id"])
            pr_number = int(github_pr["number"])

            result = await db.execute(
                select(PullRequest).where(
                    PullRequest.repository_id == repository.id,
                    PullRequest.github_pr_id == github_pr_id,
                )
            )

            pull_request = result.scalar_one_or_none()

            user = github_pr.get("user") or {}

            source_branch = (
                github_pr.get("head", {}).get("ref")
                or ""
            )

            target_branch = (
                github_pr.get("base", {}).get("ref")
                or ""
            )

            created_at = (
                PullRequestService.parse_github_datetime(
                    github_pr.get("created_at")
                )
            )

            updated_at = (
                PullRequestService.parse_github_datetime(
                    github_pr.get("updated_at")
                )
            )

            if pull_request is None:
                pull_request = PullRequest(
                    repository_id=repository.id,
                    title=github_pr.get("title") or "Untitled Pull Request",
                    github_pr_id=github_pr_id,
                    number=pr_number,
                    description=github_pr.get("body"),
                    state=github_pr.get("state") or state,
                    source_branch=source_branch,
                    target_branch=target_branch,
                    author=user.get("login"),
                    html_url=github_pr.get("html_url"),
                    created_at=created_at,
                    updated_at=updated_at,
                )

                db.add(pull_request)

            else:
                pull_request.title = (
                    github_pr.get("title")
                    or pull_request.title
                )

                pull_request.number = pr_number
                pull_request.description = github_pr.get("body")
                pull_request.state = (
                    github_pr.get("state")
                    or pull_request.state
                )
                pull_request.source_branch = source_branch
                pull_request.target_branch = target_branch
                pull_request.author = user.get("login")
                pull_request.html_url = github_pr.get("html_url")
                pull_request.created_at = created_at
                pull_request.updated_at = updated_at

            synced.append(pull_request)

        await db.commit()

        for pull_request in synced:
            await db.refresh(pull_request)

        return synced

    @staticmethod
    def parse_github_datetime(
        value: str | None,
    ) -> datetime:

        if not value:
            return datetime.now(timezone.utc)

        return datetime.fromisoformat(
            value.replace("Z", "+00:00")
        )