from typing import Any

import httpx

from app.config import settings


class GitHubOAuthService:
    AUTHORIZE_URL = "https://github.com/login/oauth/authorize"
    TOKEN_URL = "https://github.com/login/oauth/access_token"
    API_URL = "https://api.github.com"

    def _api_headers(self, access_token: str) -> dict[str, str]:
        return {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {access_token}",
            "X-GitHub-Api-Version": "2022-11-28",
        }

    async def exchange_code(
        self,
        code: str,
    ) -> dict[str, Any]:
        if not settings.GITHUB_CLIENT_ID:
            raise RuntimeError(
                "GITHUB_CLIENT_ID is not configured"
            )

        if not settings.GITHUB_CLIENT_SECRET:
            raise RuntimeError(
                "GITHUB_CLIENT_SECRET is not configured"
            )

        payload = {
            "client_id": settings.GITHUB_CLIENT_ID,
            "client_secret": settings.GITHUB_CLIENT_SECRET,
            "code": code,
        }

        headers = {
            "Accept": "application/json",
        }

        async with httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
        ) as client:
            response = await client.post(
                self.TOKEN_URL,
                data=payload,
                headers=headers,
            )

        response.raise_for_status()

        data = response.json()

        if "error" in data:
            error = data.get("error", "unknown_error")
            description = data.get(
                "error_description",
                "GitHub OAuth token exchange failed.",
            )

            raise RuntimeError(
                f"GitHub OAuth error: {error}: {description}"
            )

        access_token = data.get("access_token")

        if not access_token:
            raise RuntimeError(
                "GitHub OAuth did not return an access token."
            )

        return data

    async def get_authenticated_user(
        self,
        access_token: str,
    ) -> dict[str, Any]:
        if not access_token:
            raise RuntimeError(
                "GitHub access token is empty."
            )

        headers = self._api_headers(access_token)

        async with httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
        ) as client:
            response = await client.get(
                f"{self.API_URL}/user",
                headers=headers,
            )

        if response.status_code == 401:
            raise RuntimeError(
                "GitHub access token is invalid or expired. "
                "Please reconnect your GitHub account."
            )

        if response.status_code == 403:
            raise RuntimeError(
                "GitHub rejected the authenticated request. "
                "Check the GitHub OAuth application and token permissions."
            )

        response.raise_for_status()

        data = response.json()

        if not data.get("id"):
            raise RuntimeError(
                "GitHub authenticated-user response did not contain an id."
            )

        if not data.get("login"):
            raise RuntimeError(
                "GitHub authenticated-user response did not contain a login."
            )

        return data