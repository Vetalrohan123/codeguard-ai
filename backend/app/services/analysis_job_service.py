from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analysis_job import AnalysisJob


class AnalysisJobService:
    @staticmethod
    async def create_job(
        db: AsyncSession,
        review_id: int,
        repository_id: int,
    ) -> AnalysisJob:
        now = datetime.now(timezone.utc)

        job = AnalysisJob(
            review_id=review_id,
            repository_id=repository_id,
            status="queued",
            error=None,
            created_at=now,
            updated_at=now,
        )

        db.add(job)
        await db.flush()

        return job

    @staticmethod
    async def mark_running(
        db: AsyncSession,
        job: AnalysisJob,
    ) -> None:
        job.status = "running"
        job.error = None
        job.updated_at = datetime.now(timezone.utc)

        await db.flush()

    @staticmethod
    async def mark_completed(
        db: AsyncSession,
        job: AnalysisJob,
    ) -> None:
        job.status = "completed"
        job.error = None
        job.updated_at = datetime.now(timezone.utc)

        await db.flush()

    @staticmethod
    async def mark_failed(
        db: AsyncSession,
        job: AnalysisJob,
        error_message: str,
    ) -> None:
        job.status = "failed"
        job.error = error_message[:2000]
        job.updated_at = datetime.now(timezone.utc)

        await db.flush()