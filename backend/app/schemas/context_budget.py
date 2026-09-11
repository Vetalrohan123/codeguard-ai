from __future__ import annotations

from pydantic import BaseModel, Field


class ContextFileBudgetResponse(BaseModel):
    """
    Budget information for a single file included in
    an AI review context.
    """

    path: str
    language: str
    characters: int = Field(ge=0)
    estimated_tokens: int = Field(ge=0)
    original_characters: int = Field(ge=0)
    truncated: bool


class ContextBudgetResponse(BaseModel):
    """
    Context-budget information for one reviewed file.
    """

    current_file: ContextFileBudgetResponse

    related_files: list[ContextFileBudgetResponse]

    total_characters: int = Field(ge=0)
    total_estimated_tokens: int = Field(ge=0)

    dropped_files: list[str]


class ContextPriorityResponse(BaseModel):
    """
    Priority information for one file participating
    in the review.
    """

    path: str

    score: float = Field(ge=0.0, le=100.0)

    tier: str

    import_score: float = Field(
        ge=0.0,
        le=100.0,
    )

    static_finding_score: float = Field(
        ge=0.0,
        le=100.0,
    )

    size_score: float = Field(
        ge=0.0,
        le=100.0,
    )

    language_score: float = Field(
        ge=0.0,
        le=100.0,
    )

    dependency_score: float = Field(
        ge=0.0,
        le=100.0,
    )

    reason: str


class ReviewContextBudgetResponse(BaseModel):
    """
    Complete context-budget information returned
    by the review API.
    """

    total_characters: int = Field(ge=0)
    total_estimated_tokens: int = Field(ge=0)

    files_included: int = Field(ge=0)
    files_dropped: int = Field(ge=0)
    files_truncated: int = Field(ge=0)

    priorities: list[ContextPriorityResponse]

    budgets: dict[str, ContextBudgetResponse]