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
    Manages the Gemini AI provider.

    CodeGuard AI intentionally uses Gemini as its only AI provider.

    Responsibilities:
    - Create the configured Gemini provider
    - Call Gemini
    - Retry transient Gemini failures
    - Return the successful Gemini response
    - Raise a clear AIProviderError when Gemini fails

    Retry behavior is controlled through application settings:

        AI_MAX_RETRIES
        AI_RETRY_BASE_DELAY_SECONDS
        AI_RETRY_MAX_DELAY_SECONDS
        AI_RETRY_JITTER_SECONDS

    Architecture:

        CodeGuard AI
             |
             v
        AIProviderManager
             |
             v
        GeminiProvider
             |
             v
        Google Gemini API
    """

    def __init__(
        self,
        provider: AIProvider,
        provider_name: str = "gemini",
    ) -> None:
        self.provider = provider

        self.provider_name = (
            provider_name.strip().lower()
            if provider_name
            else "gemini"
        )

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        """
        Generate an AI response using Gemini.

        Flow:

            1. Call Gemini.
            2. Retry transient Gemini failures.
            3. Return the successful response.
            4. Raise AIProviderError if Gemini ultimately fails.

        There is intentionally no fallback provider.
        """

        async def gemini_operation() -> str:
            return await self.provider.generate(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
            )

        try:
            logger.info(
                "Starting Gemini AI generation | "
                "provider=%s",
                self.provider_name,
            )

            response = await retry_async(
                operation=gemini_operation,
                should_retry=is_retryable_error,
                max_retries=settings.AI_MAX_RETRIES,
                base_delay=settings.AI_RETRY_BASE_DELAY_SECONDS,
                max_delay=settings.AI_RETRY_MAX_DELAY_SECONDS,
                jitter=settings.AI_RETRY_JITTER_SECONDS,
                operation_name="gemini generation",
            )

            logger.info(
                "Gemini AI generation succeeded | "
                "provider=%s | chars=%d",
                self.provider_name,
                len(response),
            )

            return response

        except AIProviderError:
            logger.exception(
                "Gemini AI provider failed | "
                "provider=%s",
                self.provider_name,
            )
            raise

        except Exception as error:
            logger.exception(
                "Unexpected Gemini AI provider failure | "
                "provider=%s | error=%s",
                self.provider_name,
                error,
            )

            raise AIProviderError(
                f"Gemini AI generation failed: {error}"
            ) from error

    @classmethod
    def from_settings(
        cls,
        provider_name: str | None = None,
        model: str | None = None,
    ) -> "AIProviderManager":
        """
        Build the Gemini provider manager from application settings.

        The optional arguments are accepted so existing callers can
        explicitly provide the provider/model.

        If omitted, the application configuration is used.

        Example:

            manager = AIProviderManager.from_settings()

        Configuration:

            AI_PROVIDER=gemini
            AI_MODEL=gemini-3.6-flash
            GEMINI_API_KEY=...
        """

        normalized_provider = (
            provider_name.strip().lower()
            if provider_name
            else settings.AI_PROVIDER.strip().lower()
        )

        if not normalized_provider:
            raise AIProviderError(
                "AI provider is not configured."
            )

        # CodeGuard AI supports Gemini only.
        if normalized_provider != "gemini":
            raise AIProviderError(
                "Only Gemini is supported. "
                "Set AI_PROVIDER=gemini."
            )

        normalized_model = (
            model.strip()
            if model
            else settings.AI_MODEL.strip()
        )

        if not normalized_model:
            raise AIProviderError(
                "Gemini AI model is not configured."
            )

        if not settings.GEMINI_API_KEY:
            raise AIProviderError(
                "GEMINI_API_KEY is not configured."
            )

        if not settings.GEMINI_API_KEY.strip():
            raise AIProviderError(
                "GEMINI_API_KEY is not configured."
            )

        logger.info(
            "Initializing Gemini AI provider | model=%s",
            normalized_model,
        )

        try:
            gemini_provider = create_ai_provider(
                provider="gemini",
                model=normalized_model,
            )
        except AIProviderError:
            logger.exception(
                "Failed to initialize Gemini AI provider | "
                "model=%s",
                normalized_model,
            )
            raise
        except Exception as error:
            logger.exception(
                "Unexpected error while initializing "
                "Gemini AI provider | model=%s",
                normalized_model,
            )

            raise AIProviderError(
                f"Failed to initialize Gemini AI provider: {error}"
            ) from error

        return cls(
            provider=gemini_provider,
            provider_name="gemini",
        )


def get_ai_provider_manager() -> AIProviderManager:
    """
    Create an AIProviderManager using the current application settings.

    This helper provides a single, simple entry point for services that
    need Gemini AI generation.
    """

    return AIProviderManager.from_settings(
        provider_name=settings.AI_PROVIDER,
        model=settings.AI_MODEL,
    )
