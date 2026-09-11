import pytest

from app.services.ai_providers.retry import (
    RetryExhaustedError,
    calculate_backoff,
    retry_async,
)


def test_backoff_increases():
    first = calculate_backoff(
        attempt=0,
        base_delay=1.0,
        max_delay=10.0,
        jitter=0,
    )

    second = calculate_backoff(
        attempt=1,
        base_delay=1.0,
        max_delay=10.0,
        jitter=0,
    )

    third = calculate_backoff(
        attempt=2,
        base_delay=1.0,
        max_delay=10.0,
        jitter=0,
    )

    assert first == 1.0
    assert second == 2.0
    assert third == 4.0


def test_backoff_is_capped():
    result = calculate_backoff(
        attempt=10,
        base_delay=1.0,
        max_delay=5.0,
        jitter=0,
    )

    assert result == 5.0


@pytest.mark.asyncio
async def test_retry_eventually_succeeds():
    attempts = 0

    async def operation():
        nonlocal attempts
        attempts += 1

        if attempts < 3:
            raise TimeoutError("temporary failure")

        return "success"

    result = await retry_async(
        operation=operation,
        should_retry=lambda error: True,
        max_retries=3,
        base_delay=0,
        max_delay=0,
        jitter=0,
        operation_name="test",
    )

    assert result == "success"
    assert attempts == 3


@pytest.mark.asyncio
async def test_retry_exhausted():
    attempts = 0

    async def operation():
        nonlocal attempts
        attempts += 1
        raise TimeoutError("temporary failure")

    with pytest.raises(RetryExhaustedError):
        await retry_async(
            operation=operation,
            should_retry=lambda error: True,
            max_retries=2,
            base_delay=0,
            max_delay=0,
            jitter=0,
            operation_name="test",
        )

    assert attempts == 3


@pytest.mark.asyncio
async def test_non_retryable_error_is_not_retried():
    attempts = 0

    async def operation():
        nonlocal attempts
        attempts += 1
        raise ValueError("invalid api key")

    with pytest.raises(ValueError):
        await retry_async(
            operation=operation,
            should_retry=lambda error: False,
            max_retries=5,
            base_delay=0,
            max_delay=0,
            jitter=0,
            operation_name="test",
        )

    assert attempts == 1