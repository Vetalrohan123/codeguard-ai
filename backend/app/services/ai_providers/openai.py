from __future__ import annotations

import asyncio
import logging

from app.config import settings
from app.services.ai_providers.base import (
    AIProvider,
    AIProviderError,
)

logger = logging.getLogger(__name__)


class OpenAIProvider(AIProvider):
    """
    OpenAI implementation of the AI provider interface.

    Responsibilities:
    - Validate OpenAI configuration
    - Call OpenAI asynchronously
    - Enforce request timeout
    - Return raw model response
    - Convert provider failures into AIProviderError
    - Close the OpenAI client safely

    Retry and fallback logic are intentionally handled
    by AIProviderManager instead of this provider.
    """

    def __init__(self, model: str) -> None:
        super().__init__(model)

        if not settings.OPENAI_API_KEY:
            raise AIProviderError(
                "OPENAI_API_KEY is not configured."
            )

        if not self.model:
            raise AIProviderError(
                "OpenAI model is not configured."
            )

        if settings.AI_TIMEOUT_SECONDS <= 0:
            raise AIProviderError(
                "AI_TIMEOUT_SECONDS must be greater than 0."
            )

    async def generate(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:
        """
        Generate a response using OpenAI.

        The provider itself does not perform retry logic.
        Retry and fallback are handled by AIProviderManager.
        """

        try:
            from openai import AsyncOpenAI

        except ImportError as error:
            raise AIProviderError(
                "OpenAI SDK is not installed. "
                "Install it with: "
                "py -3.14 -m pip install -U openai"
            ) from error

        client = None

        try:
            logger.info(
                "Calling OpenAI | "
                "model=%s | timeout=%.1fs",
                self.model,
                settings.AI_TIMEOUT_SECONDS,
            )

            client = AsyncOpenAI(
                api_key=settings.OPENAI_API_KEY,
            )

            response = await asyncio.wait_for(
                client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": system_prompt,
                        },
                        {
                            "role": "user",
                            "content": user_prompt,
                        },
                    ],
                    temperature=0,
                    response_format={
                        "type": "json_object",
                    },
                ),
                timeout=settings.AI_TIMEOUT_SECONDS,
            )

            if not response.choices:
                raise AIProviderError(
                    "OpenAI returned no choices."
                )

            message = response.choices[0].message

            if not message.content:
                raise AIProviderError(
                    "OpenAI returned an empty response."
                )

            logger.info(
                "OpenAI response received | "
                "model=%s | chars=%d",
                self.model,
                len(message.content),
            )

            return message.content

        except AIProviderError:
            raise

        except (
            asyncio.TimeoutError,
            TimeoutError,
        ) as error:
            logger.warning(
                "OpenAI request timed out | "
                "model=%s | timeout=%.1fs",
                self.model,
                settings.AI_TIMEOUT_SECONDS,
            )

            raise AIProviderError(
                "OpenAI request timed out after "
                f"{settings.AI_TIMEOUT_SECONDS:.1f} seconds."
            ) from error

        except Exception as error:
            logger.exception(
                "OpenAI request failed | "
                "model=%s",
                self.model,
            )

            raise AIProviderError(
                "OpenAI request failed: "
                f"{type(error).__name__}: {error}"
            ) from error

        finally:
            if client is not None:
                try:
                    await client.close()

                except Exception:
                    logger.debug(
                        "Failed to close OpenAI client.",
                        exc_info=True,
                    )

