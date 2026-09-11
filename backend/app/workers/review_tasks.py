from __future__ import annotations

import asyncio
import logging
import selectors

from celery import Task

from app.database import AsyncSessionLocal
from app.services.review_execution_service import ReviewExecutionService
from app.workers.celery_app import celery_app


logger = logging.getLogger(__name__)


def run_async(coro):
    """
    Run an async coroutine using Windows' SelectorEventLoop.

    Psycopg async connections cannot run with Windows'
    ProactorEventLoop, which is the default event loop used by
    asyncio.run() on Windows.
    """

    loop_factory = lambda: asyncio.SelectorEventLoop(
        selectors.SelectSelector()
    )

    return asyncio.run(coro, loop_factory=loop_factory)


class ReviewTask(Task):
    autoretry_for = ()
    max_retries = 0


async def _run_review_job(job_id: int) -> dict[str, object]:
    async with AsyncSessionLocal() as db:
        logger.info(
            "Starting CodeGuard Celery review | job_id=%s",
            job_id,
        )

        result = await ReviewExecutionService.execute_job(
            db=db,
            job_id=job_id,
        )

        return {
            "job_id": result.job_id,
            "review_id": result.review_id,
            "status": result.status,
            "score": result.score,
            "files_analyzed": result.files_analyzed,
            "files_failed": result.files_failed,
            "findings_count": result.findings_count,
            "static_findings": result.static_findings,
            "ai_findings": result.ai_findings,
        }


@celery_app.task(
    bind=True,
    base=ReviewTask,
    name="codeguard.run_review",
)
def run_review_task(
    self: ReviewTask,
    job_id: int,
) -> dict[str, object]:
    logger.info(
        "Received CodeGuard review task | job_id=%s",
        job_id,
    )

    return run_async(
        _run_review_job(job_id)
    )


@celery_app.task(name="codeguard.health_check")
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "codeguard-celery",
    }