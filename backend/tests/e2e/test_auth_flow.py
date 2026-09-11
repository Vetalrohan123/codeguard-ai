def test_login_returns_access_token(
    client,
    test_credentials,
):
    response = client.post(
        "/api/auth/login",
        json={
            "email": test_credentials["email"],
            "password": test_credentials["password"],
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert (
        "access_token" in data
        or "token" in data
    )


def test_invalid_login_is_rejected(client):
    response = client.post(
        "/api/auth/login",
        json={
            "email": "invalid-e2e-user@example.com",
            "password": "wrong-password",
        },
    )

    assert response.status_code in {
        401,
        403,
    }