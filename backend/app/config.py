from __future__ import annotations

from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # =========================================================================
    # Application
    # =========================================================================
    APP_NAME: str = "CodeGuard AI"
    APP_ENV: str = "development"
    DEBUG: bool = True

    # =========================================================================
    # Database
    # =========================================================================
    # Keep the real DATABASE_URL only in .env / deployment environment.
    DATABASE_URL: str = Field(...)

    # =========================================================================
    # Redis
    # =========================================================================
    REDIS_URL: str = "redis://localhost:6379/0"

    # =========================================================================
    # JWT / Authentication
    # =========================================================================
    JWT_SECRET: str = Field(..., min_length=32)
    JWT_ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # =========================================================================
    # Cookie Security
    # =========================================================================
    COOKIE_SECURE: bool = False
    COOKIE_HTTP_ONLY: bool = True
    COOKIE_SAME_SITE: str = "lax"

    # =========================================================================
    # GitHub OAuth
    # =========================================================================
    GITHUB_CLIENT_ID: str | None = None
    GITHUB_CLIENT_SECRET: str | None = None

    GITHUB_REDIRECT_URI: str = (
        "http://127.0.0.1:8000/api/github/callback"
    )

    GITHUB_WEBHOOK_SECRET: str | None = None

    # =========================================================================
    # Frontend
    # =========================================================================
    FRONTEND_URL: str = "http://localhost:3000"

    # =========================================================================
    # AI - Gemini ONLY
    # =========================================================================
    #
    # CodeGuard AI intentionally uses only Google Gemini.
    #
    # There is:
    #   - NO OpenAI API key
    #   - NO OpenAI provider
    #   - NO fallback provider
    #   - NO fallback model
    #
    # =========================================================================
    GEMINI_API_KEY: str | None = None

    AI_PROVIDER: str = "gemini"
    AI_MODEL: str = "gemini-3.6-flash"

    # =========================================================================
    # AI Reliability
    # =========================================================================
    AI_TIMEOUT_SECONDS: float = 60.0

    AI_MAX_RETRIES: int = 2

    AI_RETRY_BASE_DELAY_SECONDS: float = 1.0
    AI_RETRY_MAX_DELAY_SECONDS: float = 8.0
    AI_RETRY_JITTER_SECONDS: float = 0.25

    # =========================================================================
    # CORS
    # =========================================================================
    CORS_ORIGINS: str = (
        "http://localhost:3000,http://127.0.0.1:3000"
    )

    # =========================================================================
    # Pydantic Settings
    # =========================================================================
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # =========================================================================
    # Validators
    # =========================================================================

    @field_validator("APP_ENV")
    @classmethod
    def validate_app_env(cls, value: str) -> str:
        value = value.strip().lower()

        allowed = {
            "development",
            "test",
            "staging",
            "production",
        }

        if value not in allowed:
            raise ValueError(
                "APP_ENV must be one of: "
                "development, test, staging, production"
            )

        return value

    @field_validator("JWT_SECRET")
    @classmethod
    def validate_jwt_secret(cls, value: str) -> str:
        value = value.strip()

        if len(value) < 32:
            raise ValueError(
                "JWT_SECRET must contain at least 32 characters"
            )

        return value

    @field_validator("COOKIE_SAME_SITE")
    @classmethod
    def validate_cookie_same_site(cls, value: str) -> str:
        value = value.strip().lower()

        allowed = {
            "lax",
            "strict",
            "none",
        }

        if value not in allowed:
            raise ValueError(
                "COOKIE_SAME_SITE must be one of: "
                "lax, strict, none"
            )

        return value

    @field_validator("CORS_ORIGINS")
    @classmethod
    def validate_cors_origins(cls, value: str) -> str:
        origins = [
            origin.strip().rstrip("/")
            for origin in value.split(",")
            if origin.strip()
        ]

        if not origins:
            raise ValueError(
                "CORS_ORIGINS must contain at least one origin"
            )

        return ",".join(origins)

    @field_validator("AI_PROVIDER")
    @classmethod
    def validate_ai_provider(cls, value: str) -> str:
        value = value.strip().lower()

        # Gemini is the ONLY supported AI provider.
        if value != "gemini":
            raise ValueError(
                "AI_PROVIDER must be: gemini"
            )

        return value

    # =========================================================================
    # Parsed CORS origins
    # =========================================================================

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip().rstrip("/")
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]

    # =========================================================================
    # Production validation
    # =========================================================================

    def validate_production(self) -> None:
        """
        Validate settings that must be secure in production.

        Development and test environments intentionally allow
        local HTTP/cookie configuration.
        """

        if self.APP_ENV != "production":
            return

        # ---------------------------------------------------------------------
        # Debug
        # ---------------------------------------------------------------------
        if self.DEBUG:
            raise ValueError(
                "DEBUG must be false when APP_ENV=production"
            )

        # ---------------------------------------------------------------------
        # Cookies
        # ---------------------------------------------------------------------
        if not self.COOKIE_SECURE:
            raise ValueError(
                "COOKIE_SECURE must be true in production"
            )

        if not self.COOKIE_HTTP_ONLY:
            raise ValueError(
                "COOKIE_HTTP_ONLY must be true in production"
            )

        if self.COOKIE_SAME_SITE != "none":
            raise ValueError(
                "COOKIE_SAME_SITE must be 'none' in production"
            )

        # ---------------------------------------------------------------------
        # Frontend HTTPS
        # ---------------------------------------------------------------------
        if self.FRONTEND_URL.startswith("http://"):
            raise ValueError(
                "FRONTEND_URL must use HTTPS in production"
            )

        # ---------------------------------------------------------------------
        # CORS HTTPS
        # ---------------------------------------------------------------------
        for origin in self.cors_origins:
            if origin.startswith("http://"):
                raise ValueError(
                    "All production CORS origins must use HTTPS"
                )

        # ---------------------------------------------------------------------
        # GitHub OAuth HTTPS
        # ---------------------------------------------------------------------
        if self.GITHUB_REDIRECT_URI.startswith("http://"):
            raise ValueError(
                "GITHUB_REDIRECT_URI must use HTTPS in production"
            )

        # ---------------------------------------------------------------------
        # Production secrets
        # ---------------------------------------------------------------------
        if not self.JWT_SECRET.strip():
            raise ValueError(
                "JWT_SECRET is required in production"
            )

        if not self.DATABASE_URL.strip():
            raise ValueError(
                "DATABASE_URL is required in production"
            )

        # ---------------------------------------------------------------------
        # Gemini
        # ---------------------------------------------------------------------
        if not self.GEMINI_API_KEY or not self.GEMINI_API_KEY.strip():
            raise ValueError(
                "GEMINI_API_KEY is required in production"
            )

        if self.AI_PROVIDER != "gemini":
            raise ValueError(
                "AI_PROVIDER must be 'gemini' in production"
            )

        if not self.AI_MODEL.strip():
            raise ValueError(
                "AI_MODEL is required in production"
            )

    # =========================================================================
    # Environment helpers
    # =========================================================================

    @property
    def is_development(self) -> bool:
        return self.APP_ENV == "development"

    @property
    def is_test(self) -> bool:
        return self.APP_ENV == "test"

    @property
    def is_staging(self) -> bool:
        return self.APP_ENV == "staging"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV == "production"


# =============================================================================
# Cached settings factory
# =============================================================================

@lru_cache
def get_settings() -> Settings:
    return Settings()


# =============================================================================
# Global settings instance
# =============================================================================

settings = get_settings()


# =============================================================================
# Validate production configuration immediately
# =============================================================================

settings.validate_production()
