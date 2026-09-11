from typing import Literal

from pydantic import BaseModel, Field


class AIFinding(BaseModel):
    severity: Literal[
        "critical",
        "high",
        "medium",
        "low",
    ]

    category: Literal[
        "bug",
        "security",
        "performance",
        "quality",
        "style",
    ]

    title: str = Field(
        min_length=1,
        max_length=500,
    )

    description: str = Field(
        min_length=1,
    )

    file: str = Field(
        min_length=1,
    )

    line: int = Field(
        ge=1,
    )

    why_it_matters: str = Field(
        min_length=1,
    )

    suggested_fix: str = Field(
        min_length=1,
    )

    fixed_code: str = Field(
        default="",
    )

    confidence: float = Field(
        ge=0.0,
        le=1.0,
    )


class AIFindingResponse(BaseModel):
    findings: list[AIFinding]
