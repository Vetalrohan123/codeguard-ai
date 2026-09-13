from __future__ import annotations

import logging
import secrets
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlencode

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    Request,
    status,
)
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.github_account import GitHubAccount
from app.models.pull_request import PullRequest
from app.models.repository import Repository
from app.models.user import User
from app.schemas.pull_request import (
    PullRequestFileResponse,
    PullRequestResponse,
)
from app.services.github_oauth import GitHubOAuthService
from app.services.github_service import GitHubService


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/github",
    tags=["GitHub"],
)

OAUTH_STATE_COOKIE = "github_oauth_state"


# ============================================================
# Helpers
# ============================================================


def parse_github_datetime(
    value: str | datetime | None,
) -> datetime:
    """
    Convert a GitHub ISO-8601 timestamp into a timezone-aware
    Python datetime.
    """

    if isinstance(value, datetime):
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)

        return value

    if not value:
        return datetime.now(timezone.utc)

    try:
        return datetime.fromisoformat(
            value.replace("Z", "+00:00")
        )
    except (TypeError, ValueError):
        return datetime.now(timezone.utc)


async def get_connected_github_account(
    db: AsyncSession,
    user_id: int,
) -> GitHubAccount:
    """
    Get the GitHub account belonging to the current CodeGuard user.
    """

    result = await db.execute(
        select(GitHubAccount).where(
            GitHubAccount.user_id == user_id
        )
    )

    account = result.scalar_one_or_none()

    if account is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub account is not connected.",
        )

    if not account.access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Connected GitHub account has no access token.",
        )

    return account


async def get_user_repository(
    db: AsyncSession,
    repository_id: int,
    user_id: int,
) -> Repository:
    """
    Get a repository only when it belongs to the current user.
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
            detail="Repository not found.",
        )

    return repository


async def get_user_github_repository(
    db: AsyncSession,
    repository_id: int,
    user_id: int,
    github_account_id: int,
) -> Repository:
    """
    Get a repository only when:

    1. It belongs to the current CodeGuard user.
    2. It is linked to the currently connected GitHub account.

    This provides an additional repository/account authorization
    boundary for GitHub API operations.
    """

    result = await db.execute(
        select(Repository).where(
            Repository.id == repository_id,
            Repository.user_id == user_id,
            Repository.github_account_id == github_account_id,
        )
    )

    repository = result.scalar_one_or_none()

    if repository is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found.",
        )

    return repository


def get_repository_name(
    repository: Repository,
) -> str:
    """
    Return the GitHub repository name safely.
    """

    if repository.name:
        return repository.name

    full_name = repository.full_name or ""

    if "/" in full_name:
        return full_name.split("/", 1)[1]

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Repository name is not configured.",
    )


def raise_github_error(
    error: Exception,
    default_detail: str = "GitHub API request failed.",
) -> None:
    """
    Convert known GitHub errors into safe API responses.

    Never expose raw GitHub/API exception messages to clients.
    """

    status_code = getattr(
        error,
        "status_code",
        None,
    )

    if status_code is None:
        response = getattr(
            error,
            "response",
            None,
        )

        if response is not None:
            status_code = getattr(
                response,
                "status_code",
                None,
            )

    if status_code == 401:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "GitHub authentication failed. "
                "Reconnect your GitHub account."
            ),
        )

    if status_code == 403:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "GitHub denied access to this resource."
            ),
        )

    if status_code == 404:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="GitHub resource not found.",
        )

    raise HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail=default_detail,
    )


# ============================================================
# GitHub OAuth Login
# ============================================================


@router.get("/login")
async def github_login(
    current_user: User = Depends(get_current_user),
):
    """
    Create a GitHub OAuth authorization URL.

    A short-lived HttpOnly state cookie is created so the
    OAuth callback can verify that the callback belongs to
    the CodeGuard user who initiated the flow.
    """

    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GITHUB_CLIENT_ID is not configured.",
        )

    if not settings.GITHUB_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GITHUB_CLIENT_SECRET is not configured.",
        )

    if not settings.GITHUB_REDIRECT_URI:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GITHUB_REDIRECT_URI is not configured.",
        )

    state = secrets.token_urlsafe(32)

    params = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": settings.GITHUB_REDIRECT_URI,
        "scope": "read:user user:email repo",
        "state": state,
    }

    github_url = (
        "https://github.com/login/oauth/authorize?"
        + urlencode(params)
    )

    response = JSONResponse(
        content={
            "success": True,
            "authorization_url": github_url,
        }
    )

    # --------------------------------------------------------
    # OAuth state cookie
    # --------------------------------------------------------
    #
    # Development:
    #   COOKIE_SECURE=false
    #   COOKIE_SAME_SITE=lax
    #
    # Production:
    #   COOKIE_SECURE=true
    #   COOKIE_SAME_SITE=none
    #
    # SameSite=None is important when the frontend and API
    # are hosted on different origins.
    # --------------------------------------------------------

    response.set_cookie(
        key=OAUTH_STATE_COOKIE,
        value=f"{current_user.id}:{state}",
        httponly=settings.COOKIE_HTTP_ONLY,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAME_SITE,
        max_age=600,
        path="/",
    )

    return response


# ============================================================
# GitHub OAuth Callback
# ============================================================


@router.get("/callback")
async def github_callback(
    request: Request,
    code: str = Query(...),
    state: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """
    GitHub OAuth callback.

    This endpoint is intentionally unauthenticated because the
    browser returns here from GitHub.

    Authorization is established through the OAuth state cookie.
    """

    state_cookie = request.cookies.get(
        OAUTH_STATE_COOKIE
    )

    if not state_cookie:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing GitHub OAuth state cookie.",
        )

    try:
        user_id_string, saved_state = state_cookie.split(
            ":",
            1,
        )

        user_id = int(user_id_string)

    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid GitHub OAuth state cookie.",
        )

    if user_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid GitHub OAuth user.",
        )

    if not saved_state or not state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid GitHub OAuth state.",
        )

    if not secrets.compare_digest(
        saved_state,
        state,
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid GitHub OAuth state.",
        )

    # --------------------------------------------------------
    # Verify CodeGuard user
    # --------------------------------------------------------

    result = await db.execute(
        select(User).where(
            User.id == user_id
        )
    )

    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="CodeGuard user not found.",
        )

    oauth_service = GitHubOAuthService()

    # --------------------------------------------------------
    # Exchange OAuth code
    # --------------------------------------------------------

    try:
        token_data = await oauth_service.exchange_code(
            code
        )

    except Exception as error:
        logger.exception(
            "GitHub OAuth token exchange failed for user %s",
            user.id,
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="GitHub OAuth token exchange failed.",
        ) from error

    access_token = token_data.get(
        "access_token"
    )

    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="GitHub did not return an access token.",
        )

    # --------------------------------------------------------
    # Get authenticated GitHub user
    # --------------------------------------------------------

    try:
        github_user = (
            await oauth_service.get_authenticated_user(
                access_token
            )
        )

    except Exception as error:
        logger.exception(
            "Failed to validate GitHub OAuth token for user %s",
            user.id,
        )

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to validate the GitHub account.",
        ) from error

    github_user_id = github_user.get("id")
    github_username = github_user.get("login")

    if not github_user_id:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="GitHub user response is missing the user ID.",
        )

    if not github_username:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="GitHub user response is missing the username.",
        )

    # --------------------------------------------------------
    # SECURITY:
    # Check whether this GitHub account is already linked
    # to another CodeGuard user.
    # --------------------------------------------------------

    result = await db.execute(
        select(GitHubAccount).where(
            GitHubAccount.github_id == github_user_id
        )
    )

    github_account_by_github_id = (
        result.scalar_one_or_none()
    )

    if (
        github_account_by_github_id is not None
        and github_account_by_github_id.user_id != user.id
    ):
        logger.warning(
            "Blocked GitHub account reassignment | "
            "github_id=%s current_user=%s existing_user=%s",
            github_user_id,
            user.id,
            github_account_by_github_id.user_id,
        )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This GitHub account is already connected "
                "to another CodeGuard account."
            ),
        )

    # --------------------------------------------------------
    # Check whether current CodeGuard user already has account
    # --------------------------------------------------------

    result = await db.execute(
        select(GitHubAccount).where(
            GitHubAccount.user_id == user.id
        )
    )

    github_account_by_user = (
        result.scalar_one_or_none()
    )

    github_account = (
        github_account_by_github_id
        or github_account_by_user
    )

    account_values: dict[str, Any] = {
        "user_id": user.id,
        "github_id": github_user_id,
        "login": github_username,
        "access_token": access_token,
    }

    if github_account is None:
        github_account = GitHubAccount(
            **account_values
        )

        db.add(github_account)

    else:
        # Defensive check against unexpected inconsistent DB state.
        if github_account.user_id != user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "This GitHub account is already connected "
                    "to another CodeGuard account."
                ),
            )

        for key, value in account_values.items():
            setattr(
                github_account,
                key,
                value,
            )

    try:
        await db.commit()

    except Exception as error:
        await db.rollback()

        logger.exception(
            "Failed to save GitHub account for user %s",
            user.id,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save GitHub account.",
        ) from error

    # --------------------------------------------------------
    # Redirect to frontend
    # --------------------------------------------------------

    response = RedirectResponse(
        url=(
            f"{settings.FRONTEND_URL}"
            "/repositories?github=connected"
        ),
        status_code=status.HTTP_307_TEMPORARY_REDIRECT,
    )

    response.delete_cookie(
        key=OAUTH_STATE_COOKIE,
        path="/",
    )

    return response


# ============================================================
# GitHub Connection Status
# ============================================================


@router.get("/status")
async def github_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(GitHubAccount).where(
            GitHubAccount.user_id == current_user.id
        )
    )

    account = result.scalar_one_or_none()

    if account is None:
        return {
            "connected": False,
            "username": None,
            "github_user_id": None,
        }

    return {
        "connected": bool(account.access_token),
        "username": account.login,
        "github_user_id": account.github_id,
    }


# ============================================================
# Import GitHub Repositories
# ============================================================


@router.post("/repositories/import")
async def import_github_repositories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = await get_connected_github_account(
        db=db,
        user_id=current_user.id,
    )

    github_service = GitHubService(
        access_token=account.access_token
    )

    try:
        github_repositories = (
            await github_service.get_user_repositories()
        )

    except Exception as error:
        logger.exception(
            "GitHub repository import failed for user %s",
            current_user.id,
        )

        raise_github_error(
            error,
            "GitHub repository import failed.",
        )

    imported_repositories: list[Repository] = []

    for github_repository in github_repositories:

        github_id = github_repository.get("id")

        if not github_id:
            continue

        full_name = github_repository.get(
            "full_name",
            "",
        )

        if "/" not in full_name:
            continue

        owner, name = full_name.split(
            "/",
            1,
        )

        # ----------------------------------------------------
        # SECURITY:
        # Repository identity is global, but ownership is not.
        #
        # First find repository by GitHub ID.
        # ----------------------------------------------------

        result = await db.execute(
            select(Repository).where(
                Repository.github_id == github_id
            )
        )

        repository = result.scalar_one_or_none()

        # ----------------------------------------------------
        # SECURITY:
        # Never silently transfer a repository from one user
        # to another.
        # ----------------------------------------------------

        if (
            repository is not None
            and repository.user_id != current_user.id
        ):
            logger.warning(
                "Blocked repository reassignment | "
                "github_repo_id=%s current_user=%s existing_user=%s",
                github_id,
                current_user.id,
                repository.user_id,
            )

            continue

        repository_values = {
            "github_id": github_id,
            "owner": owner,
            "name": name,
            "full_name": full_name,
            "language": github_repository.get(
                "language"
            ),
            "default_branch": github_repository.get(
                "default_branch",
                "main",
            ),
            "github_account_id": account.id,
            "user_id": current_user.id,
            "description": github_repository.get(
                "description"
            ),
            "html_url": github_repository.get(
                "html_url"
            ),
            "is_private": github_repository.get(
                "private",
                False,
            ),
        }

        if repository is None:
            now = datetime.now(timezone.utc)

            repository = Repository(
                **repository_values,
                created_at=now,
                updated_at=now,
            )

            db.add(repository)

        else:
            for key, value in repository_values.items():
                setattr(
                    repository,
                    key,
                    value,
                )

            repository.updated_at = datetime.now(
                timezone.utc
            )

        imported_repositories.append(
            repository
        )

    try:
        await db.commit()

    except Exception as error:
        await db.rollback()

        logger.exception(
            "Failed to persist imported repositories for user %s",
            current_user.id,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to import repositories.",
        ) from error

    for repository in imported_repositories:
        await db.refresh(repository)

    return {
        "success": True,
        "count": len(imported_repositories),
        "repositories": [
            {
                "id": repository.id,
                "github_repo_id": repository.github_id,
                "owner": repository.owner,
                "name": repository.name,
                "full_name": repository.full_name,
                "private": repository.is_private,
                "language": repository.language,
                "html_url": repository.html_url,
                "default_branch": repository.default_branch,
                "description": repository.description,
            }
            for repository in imported_repositories
        ],
    }


# ============================================================
# List Imported Repositories
# ============================================================


@router.get("/repositories")
async def list_repositories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Repository)
        .where(
            Repository.user_id == current_user.id
        )
        .order_by(
            Repository.updated_at.desc()
        )
    )

    repositories = result.scalars().all()

    return {
        "success": True,
        "count": len(repositories),
        "repositories": [
            {
                "id": repository.id,
                "github_repo_id": repository.github_id,
                "owner": repository.owner,
                "name": repository.name,
                "full_name": repository.full_name,
                "private": repository.is_private,
                "language": repository.language,
                "html_url": repository.html_url,
                "default_branch": repository.default_branch,
                "description": repository.description,
            }
            for repository in repositories
        ],
    }


# ============================================================
# Sync Pull Requests
# ============================================================


@router.post(
    "/repositories/{repository_id}/pull-requests/sync"
)
async def sync_pull_requests(
    repository_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = await get_connected_github_account(
        db=db,
        user_id=current_user.id,
    )

    repository = await get_user_github_repository(
        db=db,
        repository_id=repository_id,
        user_id=current_user.id,
        github_account_id=account.id,
    )

    github_service = GitHubService(
        access_token=account.access_token
    )

    try:
        pull_requests = (
            await github_service.get_pull_requests(
                owner=repository.owner,
                repo=get_repository_name(repository),
                state="all",
            )
        )

    except Exception as error:
        logger.exception(
            "Failed to sync pull requests | repository=%s",
            repository.id,
        )

        raise_github_error(
            error,
            "Failed to sync pull requests from GitHub.",
        )

    synced: list[PullRequest] = []

    for github_pr in pull_requests:

        github_pr_id = github_pr.get("id")
        number = github_pr.get("number")

        if not github_pr_id or not number:
            continue

        result = await db.execute(
            select(PullRequest).where(
                PullRequest.repository_id
                == repository.id,
                PullRequest.number
                == number,
            )
        )

        pull_request = result.scalar_one_or_none()

        head = github_pr.get("head") or {}
        base = github_pr.get("base") or {}
        user = github_pr.get("user") or {}

        created_at = parse_github_datetime(
            github_pr.get("created_at")
        )

        updated_at = parse_github_datetime(
            github_pr.get("updated_at")
        )

        values = {
            "repository_id": repository.id,
            "github_pr_id": str(github_pr_id),
            "number": number,
            "title": github_pr.get(
                "title",
                "",
            ),
            "description": github_pr.get(
                "body"
            ),
            "state": github_pr.get(
                "state",
                "open",
            ),
            "source_branch": head.get(
                "ref"
            ),
            "target_branch": base.get(
                "ref"
            ),
            "author": user.get(
                "login"
            ),
            "html_url": github_pr.get(
                "html_url"
            ),
            "created_at": created_at,
            "updated_at": updated_at,
        }

        if pull_request is None:
            pull_request = PullRequest(
                **values
            )

            db.add(pull_request)

        else:
            for key, value in values.items():
                setattr(
                    pull_request,
                    key,
                    value,
                )

        synced.append(
            pull_request
        )

    try:
        await db.commit()

    except Exception as error:
        await db.rollback()

        logger.exception(
            "Failed to persist synced pull requests | repository=%s",
            repository.id,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to sync pull requests.",
        ) from error

    for pull_request in synced:
        await db.refresh(pull_request)

    return {
        "success": True,
        "count": len(synced),
        "pull_requests": [
            {
                "id": pr.id,
                "repository_id": pr.repository_id,
                "github_pr_id": pr.github_pr_id,
                "number": pr.number,
                "title": pr.title,
                "description": pr.description,
                "state": pr.state,
                "source_branch": pr.source_branch,
                "target_branch": pr.target_branch,
                "author": pr.author,
                "html_url": pr.html_url,
                "created_at": pr.created_at,
                "updated_at": pr.updated_at,
            }
            for pr in synced
        ],
    }


# ============================================================
# List Pull Requests
# ============================================================


@router.get(
    "/repositories/{repository_id}/pull-requests",
    response_model=list[PullRequestResponse],
)
async def list_pull_requests(
    repository_id: int,
    state: str = Query(
        default="open",
        pattern="^(open|closed|all)$",
    ),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repository = await get_user_repository(
        db=db,
        repository_id=repository_id,
        user_id=current_user.id,
    )

    query = select(PullRequest).where(
        PullRequest.repository_id
        == repository.id
    )

    if state != "all":
        query = query.where(
            PullRequest.state == state
        )

    query = query.order_by(
        PullRequest.updated_at.desc()
    )

    result = await db.execute(query)

    return result.scalars().all()


# ============================================================
# Pull Request Details
# ============================================================


@router.get(
    "/repositories/{repository_id}/pull-requests/{pull_number}",
    response_model=PullRequestResponse,
)
async def get_pull_request(
    repository_id: int,
    pull_number: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    repository = await get_user_repository(
        db=db,
        repository_id=repository_id,
        user_id=current_user.id,
    )

    result = await db.execute(
        select(PullRequest).where(
            PullRequest.repository_id
            == repository.id,
            PullRequest.number
            == pull_number,
        )
    )

    pull_request = result.scalar_one_or_none()

    if pull_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pull request not found.",
        )

    return pull_request


# ============================================================
# Pull Request Files
# ============================================================


@router.get(
    "/repositories/{repository_id}/pull-requests/{pull_number}/files",
    response_model=list[PullRequestFileResponse],
)
async def get_pull_request_files(
    repository_id: int,
    pull_number: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = await get_connected_github_account(
        db=db,
        user_id=current_user.id,
    )

    repository = await get_user_github_repository(
        db=db,
        repository_id=repository_id,
        user_id=current_user.id,
        github_account_id=account.id,
    )

    result = await db.execute(
        select(PullRequest).where(
            PullRequest.repository_id
            == repository.id,
            PullRequest.number
            == pull_number,
        )
    )

    pull_request = result.scalar_one_or_none()

    if pull_request is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pull request not found.",
        )

    github_service = GitHubService(
        access_token=account.access_token
    )

    try:
        files = (
            await github_service.get_pull_request_files(
                owner=repository.owner,
                repo=get_repository_name(repository),
                pull_number=pull_number,
            )
        )

    except Exception as error:
        logger.exception(
            "Failed to fetch PR files | repository=%s pr=%s",
            repository.id,
            pull_number,
        )

        raise_github_error(
            error,
            "Failed to fetch pull request files from GitHub.",
        )

    return files


# ============================================================
# GitHub Pull Request Details
# ============================================================


@router.get(
    "/repositories/{repository_id}/pull-requests/{pull_number}/github"
)
async def get_github_pull_request(
    repository_id: int,
    pull_number: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = await get_connected_github_account(
        db=db,
        user_id=current_user.id,
    )

    repository = await get_user_github_repository(
        db=db,
        repository_id=repository_id,
        user_id=current_user.id,
        github_account_id=account.id,
    )

    github_service = GitHubService(
        access_token=account.access_token
    )

    try:
        pull_request = (
            await github_service.get_pull_request(
                owner=repository.owner,
                repo=get_repository_name(repository),
                pull_number=pull_number,
            )
        )

    except Exception as error:
        logger.exception(
            "Failed to fetch GitHub PR | repository=%s pr=%s",
            repository.id,
            pull_number,
        )

        raise_github_error(
            error,
            "Failed to fetch pull request from GitHub.",
        )

    return {
        "success": True,
        "pull_request": pull_request,
    }


# ============================================================
# Pull Request HEAD SHA
# ============================================================


@router.get(
    "/repositories/{repository_id}/pull-requests/{pull_number}/head"
)
async def get_pull_request_head(
    repository_id: int,
    pull_number: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    account = await get_connected_github_account(
        db=db,
        user_id=current_user.id,
    )

    repository = await get_user_github_repository(
        db=db,
        repository_id=repository_id,
        user_id=current_user.id,
        github_account_id=account.id,
    )

    github_service = GitHubService(
        access_token=account.access_token
    )

    try:
        sha = (
            await github_service.get_pull_request_head_sha(
                owner=repository.owner,
                repo=get_repository_name(repository),
                pull_number=pull_number,
            )
        )

    except Exception as error:
        logger.exception(
            "Failed to fetch PR HEAD SHA | repository=%s pr=%s",
            repository.id,
            pull_number,
        )

        raise_github_error(
            error,
            "Failed to fetch pull request HEAD SHA.",
        )

    return {
        "success": True,
        "sha": sha,
    }