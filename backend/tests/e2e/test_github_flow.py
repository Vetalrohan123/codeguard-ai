def test_github_status(
    client,
    auth_headers,
):
    response = client.get(
        "/api/github/status",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert "connected" in data


def test_repository_list(
    client,
    auth_headers,
):
    response = client.get(
        "/api/github/repositories",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, (list, dict))


def test_repository_pull_requests(
    client,
    auth_headers,
):
    repositories_response = client.get(
        "/api/github/repositories",
        headers=auth_headers,
    )

    assert repositories_response.status_code == 200

    repositories = repositories_response.json()

    if isinstance(repositories, dict):
        repositories = (
            repositories.get("repositories")
            or repositories.get("data")
            or []
        )

    if not repositories:
        pytest.skip(
            "No repositories available for E2E test."
        )

    repository_id = repositories[0]["id"]

    response = client.get(
        f"/api/github/repositories/"
        f"{repository_id}/pull-requests",
        params={"state": "open"},
        headers=auth_headers,
    )

    assert response.status_code == 200