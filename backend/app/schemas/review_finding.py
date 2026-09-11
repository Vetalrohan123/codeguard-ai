from pydantic import BaseModel, ConfigDict, Field


class ReviewFindingResponse(BaseModel):
    id: int
    review_id: int
    severity: str
    category: str
    title: str
    description: str
    file_path: str | None = None
    line_number: int | None = None
    why_it_matters: str | None = None
    suggested_fix: str | None = None
    fixed_code: str | None = None
    confidence: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
    )

    model_config = ConfigDict(from_attributes=True)