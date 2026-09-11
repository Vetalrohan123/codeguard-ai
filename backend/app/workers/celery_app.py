from __future__ import annotations

from celery import Celery

from app.config import settings


celery_app = Celery(
    "codeguard",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
)

# Explicitly import/register CodeGuard tasks.
# This is more reliable than autodiscover_tasks for our current
# package structure, especially on Windows.
celery_app.conf.imports = (
    "app.workers.review_tasks",
)