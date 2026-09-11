from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review_finding import ReviewFinding
from app.schemas.ai_finding import AIFinding


class FindingService:
    """
    Persists validated AI findings into the existing
    review_findings table.
    """

    @staticmethod
    async def save_findings(
        db: AsyncSession,
        review_id: int,
        findings: list[AIFinding],
    ) -> list[ReviewFinding]:
        """
        Save all validated AI findings for a review.

        The ReviewFinding model automatically generates
        created_at using its SQLAlchemy default.
        """

        saved_findings: list[ReviewFinding] = []

        for finding in findings:
            review_finding = ReviewFinding(
                review_id=review_id,
                severity=finding.severity,
                category=finding.category,
                title=finding.title,
                description=finding.description,
                file=finding.file,
                line=finding.line,
                why_it_matters=finding.why_it_matters,
                suggested_fix=finding.suggested_fix,
                fixed_code=finding.fixed_code,
                confidence=finding.confidence,
            )

            db.add(review_finding)
            saved_findings.append(review_finding)

        if saved_findings:
            await db.flush()

        return saved_findings

