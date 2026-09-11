import asyncio
import os

import pytest
from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# Windows + psycopg async compatibility
# ---------------------------------------------------------------------------

if os.name == "nt":
    asyncio.set_event_loop_policy(
        asyncio.WindowsSelectorEventLoopPolicy()
    )


# Import the FastAPI application after configuring the event loop.
from app.main import app


# ---------------------------------------------------------------------------
# FastAPI test client
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


# ---------------------------------------------------------------------------
# E2E credentials
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def test_credentials():
    email = os.getenv("E2E_EMAIL")
    password = os.getenv("E2E_PASSWORD")

    if not email or not password:
        pytest.skip(
            "E2E_EMAIL and E2E_PASSWORD are required."
        )

    return {
        "email": email,
        "password": password,
    }


# ---------------------------------------------------------------------------
# Authentication headers
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def auth_headers(client, test_credentials):
    response = client.post(
        "/api/auth/login",
        json={
            "email": test_credentials["email"],
            "password": test_credentials["password"],
        },
    )

    assert response.status_code == 200, (
        f"Login failed: "
        f"{response.status_code} "
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