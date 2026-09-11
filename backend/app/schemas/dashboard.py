from __future__ import annotations

from pydantic import BaseModel, Field


class DashboardStatsResponse(BaseModel):
    average_score: float = Field(ge=0, le=100)
    total_reviews: int = Field(ge=0)
    critical_findings: int = Field(ge=0)
    total_findings: int = Field(ge=0)


class ReviewTrendResponse(BaseModel):
    date: str
    score: float = Field(ge=0, le=100)


class FindingSeverityResponse(BaseModel):
    severity: str
    count: int = Field(ge=0)


class RecentReviewResponse(BaseModel):
    id: int
    repository_id: int
    pull_request_id: int | None
    score: float | None
    status: str
    summary: str | None
    created_at: str
    updated_at: str
    repository_name: str
    pull_request_number: int | None


class DashboardResponse(BaseModel):
    stats: DashboardStatsResponse
    review_trend: list[ReviewTrendResponse]
    findings_by_severity: list[FindingSeverityResponse]
    recent_reviews: list[RecentReviewResponse]