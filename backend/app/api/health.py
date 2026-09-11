from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import settings
from app.database import AsyncSessionLocal


router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check() -> dict[str, str]:
    """
    Lightweight liveness check.

    Used by Render to verify that the FastAPI process
    is running and responding to HTTP requests.

    This endpoint intentionally does not contact the
    database, Redis, GitHub, or AI providers.
    """
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/health/ready")
async def readiness_check():
    """
    Readiness check.

    Verifies that the API can successfully connect
    to PostgreSQL.

    Returns HTTP 503 when the database is unavailable.
    """
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))

        return {
            "status": "ready",
            "service": settings.APP_NAME,
            "environment": settings.APP_ENV,
            "database": "ok",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    except Exception:
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "service": settings.APP_NAME,
                "environment": settings.APP_ENV,
                "database": "unavailable",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )

