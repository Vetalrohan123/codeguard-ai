from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class TokenEstimate:
    """
    Approximate token usage for a piece of text.
    """

    characters: int
    estimated_tokens: int


class TokenEstimator:
    """
    Lightweight provider-independent token estimator.

    A rough estimate of 1 token per 4 characters is used.
    This avoids requiring a provider-specific tokenizer while
    still allowing the application to enforce a safe budget.
    """

    DEFAULT_CHARS_PER_TOKEN = 4.0

    def __init__(
        self,
        chars_per_token: float = DEFAULT_CHARS_PER_TOKEN,
    ) -> None:
        if chars_per_token <= 0:
            raise ValueError(
                "chars_per_token must be greater than zero"
            )

        self.chars_per_token = chars_per_token

    def estimate(self, text: str) -> TokenEstimate:
        characters = len(text)

        if characters == 0:
            return TokenEstimate(
                characters=0,
                estimated_tokens=0,
            )

        estimated_tokens = max(
            1,
            round(
                characters / self.chars_per_token
            ),
        )

        return TokenEstimate(
            characters=characters,
            estimated_tokens=estimated_tokens,
        )

    def estimate_tokens(self, text: str) -> int:
        return self.estimate(text).estimated_tokens