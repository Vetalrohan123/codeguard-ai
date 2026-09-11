from __future__ import annotations

import asyncio
import logging

from app.config import settings
from app.services.ai_providers.base import (
    AIProvider,
    AIProviderError,
)

logger = logging.getLogger(__name__)


class GeminiProvider(AIProvider):
    """
    Google Gemini implementation of the AI provider interface.

    Uses plain text/JSON generation only.
    No tools or automatic function calling are configured.
    """

    def __init__(self, model: str) -> None:
        super().__init__(model)

        if not settings.GEMINI_API_KEY:
            raise AIProviderError(
                "GEMINI_API_KEY is not configured."
            )

        if not self.model:
            raise AIProviderError(
                "Gemini model is not configured."
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
        Generate a JSON response using Gemini.

        Retry and fallback logic is intentionally handled by
        AIProviderManager, not this provider.
        """

        try:
            from google import genai
            from google.genai import types

        except ImportError as error:
            raise AIProviderError(
                "Gemini SDK is not installed. "
                "Install it with: "
                "py -3.14 -m pip install -U google-genai"
            ) from error

        client = None

        try:
            logger.info(
                "Calling Gemini | model=%s | timeout=%.1fs",
                self.model,
                settings.AI_TIMEOUT_SECONDS,
            )

            client = genai.Client(
                api_key=settings.GEMINI_API_KEY,
            )

            # Keep the system instructions separate from the user
            # content instead of concatenating them into one prompt.
            config = types.GenerateContentConfig(
                temperature=0,
                response_mime_type="application/json",
                system_instruction=system_prompt,
            )

            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=self.model,
                    contents=user_prompt,
                    config=config,
                ),
                timeout=settings.AI_TIMEOUT_SECONDS,
            )

            text = getattr(response, "text", None)

            if not text:
                raise AIProviderError(
                    "Gemini returned an empty response."
                )

            logger.info(
                "Gemini response received | "
                "model=%s | chars=%d",
                self.model,
                len(text),
            )

            return text

        except AIProviderError:
            raise

        except (
            asyncio.TimeoutError,
            TimeoutError,
        ) as error:
            logger.warning(
                "Gemini request timed out | "
                "model=%s | timeout=%.1fs",
                self.model,
                settings.AI_TIMEOUT_SECONDS,
            )

            raise AIProviderError(
                "Gemini request timed out after "
                f"{settings.AI_TIMEOUT_SECONDS:.1f} seconds."
            ) from error

        except Exception as error:
            logger.exception(
                "Gemini request failed | model=%s",
                self.model,
            )

            raise AIProviderError(
                "Gemini request failed: "
                f"{type(error).__name__}: {error}"
            ) from error

        finally:
            if client is not None:
                try:
                    close_method = getattr(
                        client,
                        "close",
                        None,
                    )

                    if close_method is not None:
                        close_method()

                except Exception:
                    logger.debug(
                        "Failed to close Gemini client.",
                        exc_info=True,
                    )