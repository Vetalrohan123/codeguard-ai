import os

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="session")
def client():
    """
    Shared FastAPI test client.

    Uses the application exactly as it is mounted in production,
    including /api routes.
    """
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def test_credentials():
    """
    Credentials for an existing local/test account.

    Set these in the environment before running E2E tests:

        E2E_EMAIL=test@example.com
        E2E_PASSWORD=your-password
    """

    email = os.getenv("E2E_EMAIL")
    password = os.getenv("E2E_PASSWORD")

    if not email or not password:
        pytest.skip(
            "E2E_EMAIL and E2E_PASSWORD are required for E2E tests."
        )

    return {
        "email": email,
        "password": password,
    }


@pytest.fixture(scope="session")
def auth_headers(client, test_credentials):
    """
    Authenticate once and reuse the JWT for the complete E2E suite.
    """

    response = client.post(
        "/api/auth/login",
        json={
            "email": test_credentials["email"],
            "password": test_credentials["password"],
        },
    )

    assert response.status_code == 200, (
        f"Login failed: {response.status_code} "
        f"{response.text}"
    )

    data = response.json()

    token = (
        data.get("access_token")
        or data.get("token")
    )

    assert token, (
        "Login response did not contain "
        "'access_token' or 'token'."
    )

    return {
        "Authorization": f"Bearer {token}"
    }