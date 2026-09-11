import asyncio

from app.services.ai_providers.errors import (
    is_retryable_error,
)


def test_timeout_is_retryable():
    assert is_retryable_error(
        TimeoutError("request timed out")
    )


def test_connection_error_is_retryable():
    assert is_retryable_error(
        ConnectionError("connection reset")
    )


def test_rate_limit_is_retryable():
    assert is_retryable_error(
        Exception("429 Too Many Requests")
    )


def test_server_error_is_retryable():
    assert is_retryable_error(
        Exception("503 Service Unavailable")
    )


def test_api_key_error_is_not_retryable():
    assert not is_retryable_error(
        Exception("invalid api key")
    )


def test_unauthorized_is_not_retryable():
    assert not is_retryable_error(
        Exception("401 unauthorized")
    )


def test_configuration_error_is_not_retryable():
    assert not is_retryable_error(
        Exception("GEMINI_API_KEY is not configured")
    )


def test_async_timeout_is_retryable():
    assert is_retryable_error(
        asyncio.TimeoutError()
    )