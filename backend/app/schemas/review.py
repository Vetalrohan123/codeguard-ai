from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.context_budget import (
    ReviewContextBudgetResponse,
)
from app.schemas.review_file import (
    ReviewFileResponse,
)

class ReviewResponse(BaseModel):
    id: int
    repository_id: int
    pull_request_id: int
    score: float
    status: str
    summary: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class ReviewFindingResponse(BaseModel):
    id: int
    review_id: int
    severity: str
    category: str
    title: str
    description: str
    file: str
    line: int
    why_it_matters: str | None
    suggested_fix: str | None
    fixed_code: str | None
    confidence: float | None
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class ReviewRunResponse(BaseModel):
    review: ReviewResponse

    findings: list[
        ReviewFindingResponse
    ]

    files: list[
        ReviewFileResponse
    ] = []

    files_analyzed: int
    files_failed: int

    static_findings: int
    ai_findings: int

    context_budget: (
        ReviewContextBudgetResponse
        | None
    ) = None