from __future__ import annotations

import logging

from app.config import settings
from app.services.ai_providers.base import (
    AIProvider,
    AIProviderError,
)
from app.services.ai_providers.errors import is_retryable_error
from app.services.ai_providers.factory import create_ai_provider
from app.services.ai_providers.retry import retry_async

logger = logging.getLogger(__name__)


class AIProviderManager:
    """
    Manages the primary AI provider and optional fallback provider.

    Responsibilities:
    - Call the primary provider
    - Retry transient primary-provider failures
    - Fall back to the secondary provider after primary failure
    - Retry transient fallback-provider failures
    - Return the successful AI response
    - Raise a clear error when all providers fail

    Example:

        Gemini
           |
           | transient/permanent failure
           v
        OpenAI

    Retry behavior is controlled through application settings:

        AI_MAX_RETRIES
        AI_RETRY_BASE_DELAY_SECONDS
        AI_RETRY_MAX_DELAY_SECONDS
        AI_RETRY_JITTER_SECONDS
    """

    def __init__(
        self,
        primary_provider: AIProvider,
        fallback_provider: AIProvider | None = None,
        primary_name: str = "primary",
        fallback_name: str | None = None,
    ) -> None:
        self.primary_provider = primary_provider
        self.fallback_provider = fallback_provider

        self.primary_name = (
            primary_name.strip()
            if primary_name
            else "primary"
        )

        self.fallback_name = (
            fallback_name.strip()
            if fallback_name
            else None
        )

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        """
        Generate an AI response.

        Flow:

            1. Try primary provider.
            2. Retry transient primary failures.
            3. If primary ultimately fails, try fallback.
            4. Retry transient fallback failures.
            5. If everything fails, raise AIProviderError.

        Non-retryable errors immediately move to the fallback provider.
        """

        primary_error: Exception | None = None

        async def primary_operation() -> str:
            return await self.primary_provider.generate(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
            )

        try:
            logger.info(
                "Starting primary AI provider | "
                "provider=%s",
                self.primary_name,
            )

            response = await retry_async(
                operation=primary_operation,
                should_retry=is_retryable_error,
                max_retries=settings.AI_MAX_RETRIES,
                base_delay=settings.AI_RETRY_BASE_DELAY_SECONDS,
                max_delay=settings.AI_RETRY_MAX_DELAY_SECONDS,
                jitter=settings.AI_RETRY_JITTER_SECONDS,
                operation_name=(
                    f"{self.primary_name} generation"
                ),
            )

            logger.info(
                "Primary AI provider succeeded | "
                "provider=%s",
                self.primary_name,
            )

            return response

        except Exception as error:
            primary_error = error

            logger.warning(
                "Primary AI provider failed | "
                "provider=%s | error=%s",
                self.primary_name,
                error,
            )

        if self.fallback_provider is None:
            raise AIProviderError(
                f"Primary AI provider "
                f"'{self.primary_name}' failed: "
                f"{primary_error}"
            ) from primary_error

        fallback_name = (
            self.fallback_name
            or "fallback"
        )

        fallback_error: Exception | None = None

        async def fallback_operation() -> str:
            return await self.fallback_provider.generate(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
            )

        try:
            logger.info(
                "Starting fallback AI provider | "
                "provider=%s",
                fallback_name,
            )

            response = await retry_async(
                operation=fallback_operation,
                should_retry=is_retryable_error,
                max_retries=settings.AI_MAX_RETRIES,
                base_delay=settings.AI_RETRY_BASE_DELAY_SECONDS,
                max_delay=settings.AI_RETRY_MAX_DELAY_SECONDS,
                jitter=settings.AI_RETRY_JITTER_SECONDS,
                operation_name=(
                    f"{fallback_name} generation"
                ),
            )

            logger.info(
                "Fallback AI provider succeeded | "
                "provider=%s",
                fallback_name,
            )

            return response

        except Exception as error:
            fallback_error = error

            logger.exception(
                "Fallback AI provider failed | "
                "provider=%s",
                fallback_name,
            )

        raise AIProviderError(
            "All configured AI providers failed. "
            f"Primary ({self.primary_name}): "
            f"{primary_error}. "
            f"Fallback ({fallback_name}): "
            f"{fallback_error}"
        ) from fallback_error

    @classmethod
    def from_settings(
        cls,
        primary_provider_name: str,
        primary_model: str,
        fallback_provider_name: str | None,
        fallback_model: str | None,
    ) -> "AIProviderManager":
        """
        Build the provider manager from application configuration.

        Example:

            primary_provider_name = "gemini"
            primary_model = "gemini-3.6-flash"

            fallback_provider_name = "openai"
            fallback_model = "gpt-4o-mini"
        """

        normalized_primary = (
            primary_provider_name.lower().strip()
            if primary_provider_name
            else ""
        )

        if not normalized_primary:
            raise AIProviderError(
                "Primary AI provider is not configured."
            )

        normalized_primary_model = (
            primary_model.strip()
            if primary_model
            else ""
        )

        if not normalized_primary_model:
            raise AIProviderError(
                "Primary AI model is not configured."
            )

        primary_provider = create_ai_provider(
            provider=normalized_primary,
            model=normalized_primary_model,
        )

        fallback_provider = None

        normalized_fallback = (
            fallback_provider_name.lower().strip()
            if fallback_provider_name
            else ""
        )

        if normalized_fallback:
            effective_fallback_model = (
                fallback_model.strip()
                if fallback_model
                and fallback_model.strip()
                else normalized_primary_model
            )

            if normalized_fallback == normalized_primary:
                logger.warning(
                    "Fallback provider is the same as primary "
                    "provider. Fallback will still be created, "
                    "but this configuration provides no "
                    "provider diversity."
                )

            fallback_provider = create_ai_provider(
                provider=normalized_fallback,
                model=effective_fallback_model,
            )

        return cls(
            primary_provider=primary_provider,
            fallback_provider=fallback_provider,
            primary_name=normalized_primary,
            fallback_name=(
                normalized_fallback
                or None
            ),
        )

