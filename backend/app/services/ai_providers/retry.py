from __future__ import annotations

import asyncio
import logging
import random
from collections.abc import Awaitable, Callable
from typing import TypeVar

logger = logging.getLogger(__name__)

T = TypeVar("T")


class RetryExhaustedError(Exception):
    """Raised when all retry attempts are exhausted."""


def calculate_backoff(
    attempt: int,
    base_delay: float,
    max_delay: float,
    jitter: float,
) -> float:
    """
    Calculate exponential backoff with bounded jitter.

    attempt=0 -> base delay
    attempt=1 -> base * 2
    attempt=2 -> base * 4
    """

    exponential_delay = min(
        max_delay,
        base_delay * (2**attempt),
    )

    jitter_value = (
        random.uniform(0, jitter)
        if jitter > 0
        else 0.0
    )

    return min(
        max_delay,
        exponential_delay + jitter_value,
    )


async def retry_async(
    operation: Callable[[], Awaitable[T]],
    should_retry: Callable[[Exception], bool],
    max_retries: int,
    base_delay: float,
    max_delay: float,
    jitter: float,
    operation_name: str,
) -> T:
    """
    Execute an async operation with exponential backoff.

    max_retries=0 means the operation is attempted once.
    max_retries=2 means:
        attempt 1
        retry 1
        retry 2
    """

    max_retries = max(0, max_retries)

    for attempt in range(max_retries + 1):
        try:
            return await operation()

        except Exception as error:
            if attempt >= max_retries:
                logger.error(
                    "Retry attempts exhausted | "
                    "operation=%s | attempts=%d",
                    operation_name,
                    attempt + 1,
                )

                raise RetryExhaustedError(
                    f"{operation_name} failed after "
                    f"{attempt + 1} attempts"
                ) from error

            if not should_retry(error):
                logger.warning(
                    "Non-retryable AI error | "
                    "operation=%s | error=%s",
                    operation_name,
                    error,
                )

                raise

            delay = calculate_backoff(
                attempt=attempt,
                base_delay=base_delay,
                max_delay=max_delay,
                jitter=jitter,
            )

            logger.warning(
                "Retrying AI operation | "
                "operation=%s | attempt=%d/%d | "
                "delay=%.2fs | error=%s",
                operation_name,
                attempt + 1,
                max_retries,
                delay,
                error,
            )

            await asyncio.sleep(delay)

    raise RetryExhaustedError(
        f"{operation_name} unexpectedly exhausted retries"
    )