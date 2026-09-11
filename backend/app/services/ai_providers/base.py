from __future__ import annotations

from abc import ABC, abstractmethod


class AIProviderError(Exception):
    """Base exception for AI provider failures."""


class AIProvider(ABC):
    """Abstract interface for AI providers."""

    def __init__(self, model: str) -> None:
        self.model = model.strip()

    @abstractmethod
    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        """
        Generate a response from the AI provider.

        Implementations must return the raw text response.
        """
        raise NotImplementedError