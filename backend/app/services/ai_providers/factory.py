from __future__ import annotations

from app.services.ai_providers.base import (
    AIProvider,
    AIProviderError,
)
from app.services.ai_providers.gemini import GeminiProvider


def create_ai_provider(
    provider: str,
    model: str,
) -> AIProvider:
    """
    Create the configured AI provider.

    CodeGuard AI intentionally supports Gemini only.
    OpenAI and fallback providers are not supported.
    """

    normalized_provider = (
        provider.strip().lower()
        if provider
        else ""
    )

    if normalized_provider != "gemini":
        raise AIProviderError(
            "Only Gemini is supported. "
            "Set AI_PROVIDER=gemini."
        )

    normalized_model = (
        model.strip()
        if model
        else ""
    )

    if not normalized_model:
        raise AIProviderError(
            "Gemini AI model is not configured."
        )

    try:
        return GeminiProvider(
            model=normalized_model,
        )
    except AIProviderError:
        raise
    except Exception as error:
        raise AIProviderError(
            f"Failed to initialize Gemini AI provider: {error}"
        ) from error