import os

import pytest


def _get_e2e_pr():
    repository_id = os.getenv("E2E_REPOSITORY_ID")
    pull_request_number = os.getenv("E2E_PULL_REQUEST_NUMBER")

    if not repository_id:
        pytest.skip(
            "E2E_REPOSITORY_ID is not configured."
        )

    if not pull_request_number:
        pytest.skip(
            "E2E_PULL_REQUEST_NUMBER is not configured."
        )

    return repository_id, pull_request_number


def test_pull_request_details(
    client,
    auth_headers,
):
    repository_id, pull_request_number = _get_e2e_pr()

    response = client.get(
        f"/api/github/repositories/"
        f"{repository_id}/pull-requests/"
        f"{pull_request_number}",
        headers=auth_headers,
    )

    assert response.status_code == 200, (
        f"PR details request failed: "
        f"{response.status_code} "
        f"{response.text}"
    )

    data = response.json()

    assert data is not None


def test_pull_request_changed_files(
    client,
    auth_headers,
):
    repository_id, pull_request_number = _get_e2e_pr()

    response = client.get(
        f"/api/github/repositories/"
        f"{repository_id}/pull-requests/"
        f"{pull_request_number}/files",
        headers=auth_headers,
    )

    assert response.status_code == 200, (
        f"Changed files request failed: "
        f"{response.status_code} "
        f"{response.text}"
    )

    data = response.json()

    assert data is not None

    if isinstance(data, list):
        files = data
    elif isinstance(data, dict):
        files = (
            data.get("files")
            or data.get("changed_files")
            or data.get("data")
            or []
        )
    else:
        files = []

    assert isinstance(files, list)