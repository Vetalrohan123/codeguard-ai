from __future__ import annotations

from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.github import router as github_router
from app.api.health import router as health_router
from app.api.reviews import router as reviews_router

from app.config import settings
from app.core.logging import configure_logging
from app.core.rate_limit import limiter
from app.database import engine


logger = logging.getLogger(__name__)


# =============================================================================
# Application lifespan
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle.
    """

    configure_logging()

    logger.info(
        "Starting %s | environment=%s | debug=%s",
        settings.APP_NAME,
        settings.APP_ENV,
        settings.DEBUG,
    )

    yield

    logger.info(
        "Shutting down %s",
        settings.APP_NAME,
    )

    await engine.dispose()


# =============================================================================
# FastAPI application
# =============================================================================

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="AI-powered code review platform",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


# =============================================================================
# Rate limiting
# =============================================================================

app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler,
)


# =============================================================================
# CORS
# =============================================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],
)


# =============================================================================
# Global exception handler
# =============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(
    request: Request,
    exc: Exception,
):
    """
    Prevent internal implementation details from being exposed
    to API clients.

    Full exception details are logged server-side.
    """

    logger.exception(
        "Unhandled exception | method=%s | path=%s",
        request.method,
        request.url.path,
    )

    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
        },
    )


# =============================================================================
# API routes
# =============================================================================

# Health
app.include_router(
    health_router,
    prefix="/api",
)

# Authentication
app.include_router(
    auth_router,
    prefix="/api",
)

# GitHub integration
app.include_router(
    github_router,
    prefix="/api",
)

# Code reviews
app.include_router(
    reviews_router,
    prefix="/api",
)

# Dashboard
app.include_router(
    dashboard_router,
    prefix="/api",
)


# =============================================================================
# Root endpoint
# =============================================================================

@app.get("/", tags=["Root"])
async def root() -> dict[str, str]:
    """
    Basic API information endpoint.
    """

    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
    }
