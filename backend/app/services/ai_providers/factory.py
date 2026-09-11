from __future__ import annotations

from app.services.ai_providers.base import (
    AIProvider,
    AIProviderError,
)
from app.services.ai_providers.gemini import GeminiProvider
from app.services.ai_providers.openai import OpenAIProvider


def create_ai_provider(
    provider: str,
    model: str,
) -> AIProvider:
    """
    Create an AI provider based on configuration.
    """

    normalized_provider = provider.lower().strip()

    if normalized_provider == "gemini":
        return GeminiProvider(model=model)

    if normalized_provider == "openai":
        return OpenAIProvider(model=model)

    raise AIProviderError(
        f"Unsupported AI provider: {provider}"
    )