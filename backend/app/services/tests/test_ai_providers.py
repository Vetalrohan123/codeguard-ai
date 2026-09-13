import pytest

from app.services.ai_providers.base import (
    AIProvider,
    AIProviderError,
)
from app.services.ai_providers.factory import (
    create_ai_provider,
)
from app.services.ai_providers.gemini import (
    GeminiProvider,
)


def test_create_gemini_provider(
    monkeypatch,
):
    monkeypatch.setattr(
        "app.services.ai_providers.gemini.settings.GEMINI_API_KEY",
        "test-key",
    )

    provider = create_ai_provider(
        provider="gemini",
        model="test-model",
    )

    assert isinstance(
        provider,
        GeminiProvider,
    )

    assert provider.model == "test-model"


def test_factory_rejects_openai():
    with pytest.raises(
        AIProviderError,
        match="Only Gemini is supported",
    ):
        create_ai_provider(
            provider="openai",
            model="test-model",
        )


def test_factory_rejects_unknown_provider():
    with pytest.raises(
        AIProviderError,
        match="Only Gemini is supported",
    ):
        create_ai_provider(
            provider="unknown",
            model="test-model",
        )


def test_factory_rejects_empty_provider():
    with pytest.raises(
        AIProviderError,
        match="Only Gemini is supported",
    ):
        create_ai_provider(
            provider="",
            model="test-model",
        )


def test_factory_rejects_empty_model(
    monkeypatch,
):
    monkeypatch.setattr(
        "app.services.ai_providers.gemini.settings.GEMINI_API_KEY",
        "test-key",
    )

    with pytest.raises(
        AIProviderError,
        match="Gemini AI model is not configured",
    ):
        create_ai_provider(
            provider="gemini",
            model="",
        )


def test_gemini_requires_api_key(
    monkeypatch,
):
    monkeypatch.setattr(
        "app.services.ai_providers.gemini.settings.GEMINI_API_KEY",
        None,
    )

    with pytest.raises(AIProviderError):
        GeminiProvider(
            model="test-model",
        )


class MockProvider(AIProvider):
    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        return '{"findings": []}'


@pytest.mark.asyncio
async def test_mock_provider():
    provider = MockProvider(
        model="mock-model",
    )

    result = await provider.generate(
        system_prompt="system",
        user_prompt="user",
    )

    assert result == '{"findings": []}'
