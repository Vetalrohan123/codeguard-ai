from __future__ import annotations

import asyncio


RETRYABLE_ERROR_KEYWORDS = (
    "timeout",
    "timed out",
    "429",
    "rate limit",
    "rate_limit",
    "too many requests",
    "503",
    "502",
    "504",
    "service unavailable",
    "bad gateway",
    "gateway timeout",
    "temporarily unavailable",
    "connection reset",
    "connection refused",
    "connection aborted",
    "connection error",
    "network error",
)


NON_RETRYABLE_ERROR_KEYWORDS = (
    "invalid api key",
    "invalid_api_key",
    "api key not valid",
    "authentication failed",
    "unauthorized",
    "permission denied",
    "forbidden",
    "not configured",
    "unsupported ai provider",
    "model is not configured",
)


def is_retryable_error(error: Exception) -> bool:
    """
    Determine whether an AI provider error is likely temporary.
    """

    if isinstance(
        error,
        (
            asyncio.TimeoutError,
            TimeoutError,
            ConnectionError,
        ),
    ):
        return True

    message = str(error).lower()

    for keyword in NON_RETRYABLE_ERROR_KEYWORDS:
        if keyword in message:
            return False

    for keyword in RETRYABLE_ERROR_KEYWORDS:
        if keyword in message:
            return True

    return False