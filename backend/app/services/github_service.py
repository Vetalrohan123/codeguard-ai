from __future__ import annotations

import base64
from typing import Any

import httpx


class GitHubService:
    """
    Service responsible for communicating with the GitHub REST API.

    Responsibilities:
    - Authenticate GitHub API requests
    - Fetch authenticated GitHub user
    - Fetch repositories
    - Fetch pull requests
    - Fetch pull request details
    - Fetch changed files
    - Fetch pull request HEAD SHA
    - Fetch repository file contents
    """

    BASE_URL = "https://api.github.com"

    def __init__(self, access_token: str):
        if not access_token:
            raise ValueError(
                "GitHub access token is required."
            )

        self.access_token = access_token

    # ============================================================
    # Headers
    # ============================================================

    def _headers(self) -> dict[str, str]:
        """
        Build standard GitHub API headers.

        The access token is intentionally never logged.
        """

        return {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {self.access_token}",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    # ============================================================
    # HTTP Helpers
    # ============================================================

    async def _get(
        self,
        url: str,
        *,
        params: dict[str, Any] | None = None,
    ) -> httpx.Response:
        """
        Execute an authenticated GET request against GitHub.

        Provides consistent handling for:
        - Network errors
        - 401 authentication failures
        - 403 permission failures
        - 404 missing resources
        - Other HTTP errors

        Never logs the access token.
        """

        async with httpx.AsyncClient(
            base_url=self.BASE_URL,
            headers=self._headers(),
            timeout=30.0,
        ) as client:
            try:
                response = await client.get(
                    url,
                    params=params,
                )

            except httpx.RequestError as error:
                raise RuntimeError(
                    "Unable to connect to GitHub API."
                ) from error

        # --------------------------------------------------------
        # Authentication
        # --------------------------------------------------------

        if response.status_code == 401:
            raise RuntimeError(
                "GitHub authentication failed. "
                "The connected GitHub access token may be "
                "expired, revoked, invalid, or no longer valid. "
                "Reconnect the GitHub account."
            )

        # --------------------------------------------------------
        # Permissions / rate limits
        # --------------------------------------------------------

        if response.status_code == 403:
            remaining = response.headers.get(
                "X-RateLimit-Remaining"
            )

            if remaining == "0":
                raise RuntimeError(
                    "GitHub API rate limit exceeded. "
                    "Please wait before trying again."
                )

            raise RuntimeError(
                "GitHub denied access to this resource. "
                "Check the GitHub token permissions and "
                "repository access."
            )

        # --------------------------------------------------------
        # Resource not found
        # --------------------------------------------------------

        if response.status_code == 404:
            raise RuntimeError(
                "GitHub could not find the requested resource. "
                "Check the repository, pull request, or "
                "GitHub account permissions."
            )

        # --------------------------------------------------------
        # Other HTTP errors
        # --------------------------------------------------------

        try:
            response.raise_for_status()

        except httpx.HTTPStatusError as error:
            raise RuntimeError(
                "GitHub API request failed with "
                f"HTTP {response.status_code}."
            ) from error

        return response

    # ============================================================
    # Authenticated User
    # ============================================================

    async def get_authenticated_user(
        self,
    ) -> dict[str, Any]:
        """
        Fetch the currently authenticated GitHub user.

        GitHub endpoint:
        GET /user
        """

        response = await self._get("/user")

        data = response.json()

        if not isinstance(data, dict):
            raise ValueError(
                "GitHub authenticated user API returned "
                "an unexpected response."
            )

        return data

    # ============================================================
    # User Repositories
    # ============================================================

    async def get_user_repositories(
        self,
        page: int = 1,
        per_page: int = 30,
    ) -> list[dict[str, Any]]:
        """
        Fetch repositories accessible by the authenticated user.

        GitHub endpoint:
        GET /user/repos
        """

        params = {
            "page": page,
            "per_page": min(per_page, 100),
            "sort": "updated",
            "direction": "desc",
        }

        response = await self._get(
            "/user/repos",
            params=params,
        )

        data = response.json()

        if not isinstance(data, list):
            raise ValueError(
                "GitHub repositories API returned "
                "an unexpected response."
            )

        return data

    # ============================================================
    # Pull Requests
    # ============================================================

    async def get_pull_requests(
        self,
        owner: str,
        repo: str,
        state: str = "open",
        page: int = 1,
        per_page: int = 100,
    ) -> list[dict[str, Any]]:
        """
        Fetch pull requests from a GitHub repository.

        GitHub endpoint:
        GET /repos/{owner}/{repo}/pulls

        Returns normalized PR dictionaries while preserving
        important GitHub metadata.
        """

        url = f"/repos/{owner}/{repo}/pulls"

        params = {
            "state": state,
            "sort": "updated",
            "direction": "desc",
            "page": page,
            "per_page": min(per_page, 100),
        }

        response = await self._get(
            url,
            params=params,
        )

        data = response.json()

        if not isinstance(data, list):
            raise ValueError(
                "GitHub pull request API returned "
                "an unexpected response."
            )

        normalized_prs: list[dict[str, Any]] = []

        for pr in data:
            if not isinstance(pr, dict):
                continue

            head = pr.get("head") or {}
            base = pr.get("base") or {}
            user = pr.get("user") or {}

            normalized_pr = {
                # ------------------------------------------------
                # GitHub identifiers
                # ------------------------------------------------
                "id": pr.get("id"),
                "number": pr.get("number"),

                # ------------------------------------------------
                # Basic information
                # ------------------------------------------------
                "title": pr.get("title"),
                "body": pr.get("body"),
                "state": pr.get("state"),

                # ------------------------------------------------
                # Branch information
                # ------------------------------------------------
                "head": head,
                "base": base,

                # ------------------------------------------------
                # Author
                # ------------------------------------------------
                "user": user,

                # ------------------------------------------------
                # URLs
                # ------------------------------------------------
                "html_url": pr.get("html_url"),
                "url": pr.get("url"),

                # ------------------------------------------------
                # Timestamps
                # ------------------------------------------------
                "created_at": pr.get("created_at"),
                "updated_at": pr.get("updated_at"),
                "closed_at": pr.get("closed_at"),
                "merged_at": pr.get("merged_at"),

                # ------------------------------------------------
                # Statistics
                # ------------------------------------------------
                "comments": pr.get("comments", 0),
                "review_comments": pr.get(
                    "review_comments",
                    0,
                ),
                "commits": pr.get(
                    "commits",
                    0,
                ),
                "additions": pr.get(
                    "additions",
                    0,
                ),
                "deletions": pr.get(
                    "deletions",
                    0,
                ),
                "changed_files": pr.get(
                    "changed_files",
                    0,
                ),

                # ------------------------------------------------
                # Original GitHub response
                # ------------------------------------------------
                "_github_data": pr,
            }

            normalized_prs.append(
                normalized_pr
            )

        return normalized_prs

    # ============================================================
    # Pull Request Details
    # ============================================================

    async def get_pull_request(
        self,
        owner: str,
        repo: str,
        pull_number: int,
    ) -> dict[str, Any]:
        """
        Fetch detailed information about a pull request.

        GitHub endpoint:
        GET /repos/{owner}/{repo}/pulls/{pull_number}
        """

        url = (
            f"/repos/{owner}/{repo}"
            f"/pulls/{pull_number}"
        )

        response = await self._get(url)

        data = response.json()

        if not isinstance(data, dict):
            raise ValueError(
                "GitHub pull request API returned "
                "an unexpected response."
            )

        return data

    # ============================================================
    # Pull Request HEAD SHA
    # ============================================================

    async def get_pull_request_head_sha(
        self,
        owner: str,
        repo: str,
        pull_number: int,
    ) -> str:
        """
        Return the HEAD commit SHA of a pull request.
        """

        pull_request = await self.get_pull_request(
            owner=owner,
            repo=repo,
            pull_number=pull_number,
        )

        head = pull_request.get("head") or {}

        sha = head.get("sha")

        if not sha:
            raise ValueError(
                "GitHub pull request does not contain "
                "a HEAD commit SHA."
            )

        return sha

    # ============================================================
    # Pull Request Changed Files
    # ============================================================

    async def get_pull_request_files(
        self,
        owner: str,
        repo: str,
        pull_number: int,
        page: int = 1,
        per_page: int = 100,
    ) -> list[dict[str, Any]]:
        """
        Fetch files changed by a pull request.

        GitHub endpoint:
        GET /repos/{owner}/{repo}/pulls/{pull_number}/files

        Each returned item may contain fields such as:
        - filename
        - status
        - additions
        - deletions
        - changes
        - blob_url
        - raw_url
        - contents_url
        - patch
        """

        url = (
            f"/repos/{owner}/{repo}"
            f"/pulls/{pull_number}/files"
        )

        params = {
            "page": page,
            "per_page": min(per_page, 100),
        }

        response = await self._get(
            url,
            params=params,
        )

        data = response.json()

        if not isinstance(data, list):
            raise ValueError(
                "GitHub pull request files API returned "
                "an unexpected response."
            )

        return data

    # ============================================================
    # File Content
    # ============================================================

    async def get_file_content(
        self,
        owner: str,
        repo: str,
        path: str,
        ref: str,
    ) -> str:
        """
        Fetch and decode the contents of a repository file.

        GitHub endpoint:
        GET /repos/{owner}/{repo}/contents/{path}

        The GitHub API normally returns file contents as
        base64-encoded data.
        """

        url = (
            f"/repos/{owner}/{repo}"
            f"/contents/{path}"
        )

        response = await self._get(
            url,
            params={
                "ref": ref,
            },
        )

        data = response.json()

        # GitHub returns a list for directories.
        if isinstance(data, list):
            raise ValueError(
                f"GitHub path is a directory, not a file: "
                f"{path}"
            )

        if not isinstance(data, dict):
            raise ValueError(
                f"GitHub returned an unexpected response "
                f"for file: {path}"
            )

        content = data.get("content")

        if not content:
            raise ValueError(
                f"GitHub returned no content for file: "
                f"{path}"
            )

        try:
            decoded = base64.b64decode(
                content.replace("\n", "")
            ).decode("utf-8")

        except (
            ValueError,
            UnicodeDecodeError,
        ) as error:
            raise ValueError(
                f"Unable to decode GitHub file: {path}"
            ) from error

        return decoded