import pytest

from app.services.ai_providers.base import (
    AIProvider,
    AIProviderError,
)
from app.services.ai_providers.manager import (
    AIProviderManager,
)


class SuccessfulProvider(AIProvider):
    def __init__(
        self,
        model: str = "test-model",
        response: str = '{"findings": []}',
    ) -> None:
        super().__init__(model)
        self.response = response
        self.calls = 0

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        self.calls += 1
        return self.response


class FailingProvider(AIProvider):
    def __init__(
        self,
        model: str = "test-model",
        message: str = "provider failed",
    ) -> None:
        super().__init__(model)
        self.message = message
        self.calls = 0

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        self.calls += 1

        raise AIProviderError(
            self.message
        )


@pytest.mark.asyncio
async def test_primary_provider_success():
    primary = SuccessfulProvider(
        response='{"findings": []}'
    )

    fallback = SuccessfulProvider(
        response='{"findings": [{"fallback": true}]}' 
    )

    manager = AIProviderManager(
        primary_provider=primary,
        fallback_provider=fallback,
        primary_name="gemini",
        fallback_name="openai",
    )

    result = await manager.generate(
        system_prompt="system",
        user_prompt="user",
    )

    assert result == '{"findings": []}'

    assert primary.calls == 1
    assert fallback.calls == 0


@pytest.mark.asyncio
async def test_fallback_used_when_primary_fails():
    primary = FailingProvider(
        message="Gemini unavailable"
    )

    fallback = SuccessfulProvider(
        response='{"findings": []}'
    )

    manager = AIProviderManager(
        primary_provider=primary,
        fallback_provider=fallback,
        primary_name="gemini",
        fallback_name="openai",
    )

    result = await manager.generate(
        system_prompt="system",
        user_prompt="user",
    )

    assert result == '{"findings": []}'

    assert primary.calls == 1
    assert fallback.calls == 1


@pytest.mark.asyncio
async def test_primary_failure_without_fallback():
    primary = FailingProvider(
        message="Gemini unavailable"
    )

    manager = AIProviderManager(
        primary_provider=primary,
        fallback_provider=None,
        primary_name="gemini",
    )

    with pytest.raises(AIProviderError) as error:
        await manager.generate(
            system_prompt="system",
            user_prompt="user",
        )

    assert "Gemini unavailable" in str(
        error.value
    )

    assert primary.calls == 1


@pytest.mark.asyncio
async def test_both_providers_fail():
    primary = FailingProvider(
        message="Gemini unavailable"
    )

    fallback = FailingProvider(
        message="OpenAI unavailable"
    )

    manager = AIProviderManager(
        primary_provider=primary,
        fallback_provider=fallback,
        primary_name="gemini",
        fallback_name="openai",
    )

    with pytest.raises(AIProviderError) as error:
        await manager.generate(
            system_prompt="system",
            user_prompt="user",
        )

    message = str(error.value)

    assert "Gemini unavailable" in message
    assert "OpenAI unavailable" in message

    assert primary.calls == 1
    assert fallback.calls == 1


@pytest.mark.asyncio
async def test_fallback_is_not_used_after_success():
    primary = SuccessfulProvider()
    fallback = SuccessfulProvider()

    manager = AIProviderManager(
        primary_provider=primary,
        fallback_provider=fallback,
        primary_name="gemini",
        fallback_name="openai",
    )

    await manager.generate(
        system_prompt="system",
        user_prompt="user",
    )

    assert primary.calls == 1
    assert fallback.calls == 0