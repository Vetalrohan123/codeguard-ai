from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.pull_request import PullRequest
from app.models.repository import Repository
from app.models.review import Review
from app.models.review_finding import ReviewFinding
from app.models.user import User
from app.schemas.dashboard import (
    DashboardResponse,
    DashboardStatsResponse,
    FindingSeverityResponse,
    RecentReviewResponse,
    ReviewTrendResponse,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "/",
    response_model=DashboardResponse,
)
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardResponse:

    # ---------------------------------------------------------
    # 1. Total reviews + average score
    # ---------------------------------------------------------

    review_stats_result = await db.execute(
        select(
            func.count(Review.id),
            func.avg(Review.score),
        )
        .join(
            Repository,
            Repository.id == Review.repository_id,
        )
        .where(
            Repository.user_id == current_user.id,
        )
    )

    total_reviews, average_score = review_stats_result.one()

    total_reviews = int(total_reviews or 0)
    average_score = float(average_score or 0)

    # ---------------------------------------------------------
    # 2. Total findings
    # ---------------------------------------------------------

    findings_count_result = await db.execute(
        select(
            func.count(ReviewFinding.id),
        )
        .join(
            Review,
            Review.id == ReviewFinding.review_id,
        )
        .join(
            Repository,
            Repository.id == Review.repository_id,
        )
        .where(
            Repository.user_id == current_user.id,
        )
    )

    total_findings = int(
        findings_count_result.scalar_one() or 0
    )

    # ---------------------------------------------------------
    # 3. Critical findings
    # ---------------------------------------------------------

    critical_result = await db.execute(
        select(
            func.count(ReviewFinding.id),
        )
        .join(
            Review,
            Review.id == ReviewFinding.review_id,
        )
        .join(
            Repository,
            Repository.id == Review.repository_id,
        )
        .where(
            Repository.user_id == current_user.id,
            func.lower(
                ReviewFinding.severity,
            ) == "critical",
        )
    )

    critical_findings = int(
        critical_result.scalar_one() or 0
    )

    # ---------------------------------------------------------
    # 4. Findings grouped by severity
    # ---------------------------------------------------------

    severity_result = await db.execute(
        select(
            ReviewFinding.severity,
            func.count(ReviewFinding.id),
        )
        .join(
            Review,
            Review.id == ReviewFinding.review_id,
        )
        .join(
            Repository,
            Repository.id == Review.repository_id,
        )
        .where(
            Repository.user_id == current_user.id,
        )
        .group_by(
            ReviewFinding.severity,
        )
        .order_by(
            ReviewFinding.severity,
        )
    )

    findings_by_severity = [
        FindingSeverityResponse(
            severity=str(severity),
            count=int(count),
        )
        for severity, count in severity_result.all()
    ]

    # ---------------------------------------------------------
    # 5. Review score trend
    # ---------------------------------------------------------

    trend_result = await db.execute(
        select(
            Review.created_at,
            Review.score,
        )
        .join(
            Repository,
            Repository.id == Review.repository_id,
        )
        .where(
            Repository.user_id == current_user.id,
            Review.score.is_not(None),
        )
        .order_by(
            Review.created_at.asc(),
        )
        .limit(30)
    )

    review_trend = [
        ReviewTrendResponse(
            date=created_at.isoformat(),
            score=float(score),
        )
        for created_at, score in trend_result.all()
    ]

    # ---------------------------------------------------------
    # 6. Recent reviews
    # ---------------------------------------------------------

    recent_result = await db.execute(
        select(
            Review,
            Repository.name,
            PullRequest.number,
        )
        .join(
            Repository,
            Repository.id == Review.repository_id,
        )
        .outerjoin(
            PullRequest,
            PullRequest.id == Review.pull_request_id,
        )
        .where(
            Repository.user_id == current_user.id,
        )
        .order_by(
            Review.created_at.desc(),
        )
        .limit(10)
    )

    recent_reviews = []

    for (
        review,
        repository_name,
        pull_request_number,
    ) in recent_result.all():

        recent_reviews.append(
            RecentReviewResponse(
                id=review.id,
                repository_id=review.repository_id,
                pull_request_id=review.pull_request_id,
                score=(
                    float(review.score)
                    if review.score is not None
                    else None
                ),
                status=review.status,
                summary=review.summary,
                created_at=review.created_at.isoformat(),
                updated_at=review.updated_at.isoformat(),
                repository_name=repository_name,
                pull_request_number=pull_request_number,
            )
        )

    # ---------------------------------------------------------
    # 7. Final response
    # ---------------------------------------------------------

    return DashboardResponse(
        stats=DashboardStatsResponse(
            average_score=round(
                average_score,
                2,
            ),
            total_reviews=total_reviews,
            critical_findings=critical_findings,
            total_findings=total_findings,
        ),
        review_trend=review_trend,
        findings_by_severity=findings_by_severity,
        recent_reviews=recent_reviews,
    )