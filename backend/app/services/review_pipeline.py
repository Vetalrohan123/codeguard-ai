from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review import Review
from app.schemas.ai_finding import AIFinding
from app.services.context_budget import BudgetResult
from app.services.context_prioritizer import FilePriority
from app.services.finding_aggregator import FindingAggregator
from app.services.finding_service import FindingService
from app.services.language_detector import detect_language
from app.services.review_orchestrator import (
    ReviewFile,
    ReviewOrchestrator,
    ReviewResult,
)
from app.services.static_analysis.models import StaticFinding
from app.services.static_analysis.service import StaticAnalysisService


logger = logging.getLogger(__name__)


@dataclass
class PipelineFile:
    """
    A source file supplied to the review pipeline.
    """

    path: str
    content: str


@dataclass
class PersistedReviewResult:
    """
    Result returned by the review pipeline after findings
    have been persisted to the current database transaction.
    """

    review_id: int

    findings: list[AIFinding]

    files_analyzed: int
    files_failed: int

    score: float

    static_findings: int
    ai_findings: int

    priorities: list[FilePriority] = field(
        default_factory=list
    )

    budget_results: dict[str, BudgetResult] = field(
        default_factory=dict
    )

    static_failed: bool = False
    ai_failed: bool = False


class ReviewPipeline:
    """
    Production review pipeline.

    Pipeline:

        Source Files
            |
            v
        Language Detection
            |
            v
        Static Analysis
            |
            v
        AI Review
            |
            v
        AI Severity Calibration
            |
            v
        Finding Aggregation
            |
            v
        Deduplication
            |
            v
        Priority Sorting
            |
            v
        Context Budgeting
            |
            v
        Persistence
            |
            v
        Score Calculation

    Database transaction ownership:

        The API route owns the transaction.

    This service may:

        - add database objects
        - update database objects
        - flush the session

    This service must NEVER:

        - commit
        - rollback
    """

    def __init__(
        self,
        orchestrator: ReviewOrchestrator | None = None,
        static_analysis_service: (
            StaticAnalysisService | None
        ) = None,
    ) -> None:
        self.orchestrator = (
            orchestrator
            if orchestrator is not None
            else ReviewOrchestrator()
        )

        self.static_analysis_service = (
            static_analysis_service
            if static_analysis_service is not None
            else StaticAnalysisService()
        )

    # ==================================================================
    # Main pipeline
    # ==================================================================

    async def run(
        self,
        db: AsyncSession,
        review_id: int,
        files: list[PipelineFile],
    ) -> PersistedReviewResult:
        """
        Execute the complete code-review pipeline.

        The method intentionally does not commit or rollback.
        """

        review_files: list[ReviewFile] = []

        static_files: list[
            tuple[str, str, str | None]
        ] = []

        # --------------------------------------------------------------
        # Prepare files
        # --------------------------------------------------------------

        for file in files:
            if not file.content.strip():
                logger.debug(
                    "Skipping empty file: %s",
                    file.path,
                )
                continue

            language = detect_language(
                file.path
            )

            review_files.append(
                ReviewFile(
                    path=file.path,
                    content=file.content,
                    language=language,
                )
            )

            static_files.append(
                (
                    file.path,
                    file.content,
                    language,
                )
            )

        logger.info(
            "Prepared %s files for review %s",
            len(review_files),
            review_id,
        )

        # --------------------------------------------------------------
        # Handle no-reviewable-files case
        # --------------------------------------------------------------

        if not review_files:
            logger.warning(
                "Review %s contains no non-empty files",
                review_id,
            )

            await FindingService.save_findings(
                db=db,
                review_id=review_id,
                findings=[],
            )

            await db.flush()

            return PersistedReviewResult(
                review_id=review_id,
                findings=[],
                files_analyzed=0,
                files_failed=0,
                score=0.0,
                static_findings=0,
                ai_findings=0,
                priorities=[],
                budget_results={},
                static_failed=False,
                ai_failed=False,
            )

        # --------------------------------------------------------------
        # Static analysis
        # --------------------------------------------------------------

        static_findings: list[StaticFinding] = []

        static_failed = False

        if static_files:
            try:
                static_findings = (
                    await self.static_analysis_service.analyze_files(
                        static_files
                    )
                )

                logger.info(
                    "Static analysis completed for review %s: "
                    "%s findings",
                    review_id,
                    len(static_findings),
                )

            except Exception:
                logger.exception(
                    "Static analysis failed for review %s",
                    review_id,
                )

                static_failed = True
                static_findings = []

        # --------------------------------------------------------------
        # AI analysis
        # --------------------------------------------------------------

        ai_failed = False

        ai_result = ReviewResult(
            findings=[],
            files_analyzed=0,
            files_failed=0,
            priorities=[],
            budget_results={},
        )

        try:
            ai_result = (
                await self.orchestrator.review_files(
                    files=review_files,
                    static_findings=static_findings,
                )
            )

            logger.info(
                "AI review completed for review %s: "
                "%s findings, %s files analyzed, "
                "%s files failed",
                review_id,
                len(ai_result.findings),
                ai_result.files_analyzed,
                ai_result.files_failed,
            )

            logger.info(
                "Context budgeting completed for review %s: "
                "%s prioritized files, "
                "%s budget results",
                review_id,
                len(ai_result.priorities),
                len(ai_result.budget_results),
            )

        except Exception:
            logger.exception(
                "AI review failed for review %s",
                review_id,
            )

            ai_failed = True

            ai_result = ReviewResult(
                findings=[],
                files_analyzed=0,
                files_failed=len(
                    review_files
                ),
                priorities=[],
                budget_results={},
            )

        # --------------------------------------------------------------
        # Detect complete AI failure
        # --------------------------------------------------------------

        if (
            not ai_failed
            and ai_result.files_analyzed == 0
            and ai_result.files_failed > 0
        ):
            ai_failed = True

            logger.error(
                "AI review completely failed for review %s | "
                "files=%d | failed=%d",
                review_id,
                len(review_files),
                ai_result.files_failed,
            )

        # --------------------------------------------------------------
        # AI findings
        # --------------------------------------------------------------

        ai_findings = ai_result.findings

        # --------------------------------------------------------------
        # AI severity calibration
        # --------------------------------------------------------------

        calibrated_ai_findings: list[AIFinding] = []

        for finding in ai_findings:
            calibrated_finding = (
                FindingAggregator.calibrate_severity(
                    finding=finding,
                    source="ai",
                )
            )

            calibrated_ai_findings.append(
                calibrated_finding
            )

        logger.info(
            "Calibrated %s AI findings for review %s",
            len(calibrated_ai_findings),
            review_id,
        )

        # --------------------------------------------------------------
        # Merge AI + static findings
        # --------------------------------------------------------------

        combined_findings = (
            FindingAggregator.merge(
                ai_findings=calibrated_ai_findings,
                static_findings=static_findings,
            )
        )

        logger.info(
            "Merged findings for review %s: %s",
            review_id,
            len(combined_findings),
        )

        # --------------------------------------------------------------
        # Sort final findings
        # --------------------------------------------------------------

        final_findings = (
            FindingAggregator.sort(
                combined_findings
            )
        )

        # --------------------------------------------------------------
        # Persist findings
        # --------------------------------------------------------------

        await FindingService.save_findings(
            db=db,
            review_id=review_id,
            findings=final_findings,
        )

        await db.flush()

        # --------------------------------------------------------------
        # Calculate score
        # --------------------------------------------------------------

        if ai_failed and ai_result.files_analyzed == 0:
            score = 0.0

            logger.error(
                "Review %s did not receive a valid AI analysis. "
                "Score forced to 0.0 instead of calculating "
                "a false 100.0 score.",
                review_id,
            )

        else:
            score = self.calculate_score(
                final_findings
            )

            logger.info(
                "Review %s calculated score %.2f",
                review_id,
                score,
            )

        # --------------------------------------------------------------
        # Persist context budget
        # --------------------------------------------------------------

        await self._persist_context_budget(
            db=db,
            review_id=review_id,
            priorities=ai_result.priorities,
            budget_results=ai_result.budget_results,
        )

        # --------------------------------------------------------------
        # Return complete pipeline result
        # --------------------------------------------------------------

        return PersistedReviewResult(
            review_id=review_id,
            findings=final_findings,
            files_analyzed=(
                ai_result.files_analyzed
            ),
            files_failed=(
                ai_result.files_failed
            ),
            score=score,
            static_findings=len(
                static_findings
            ),
            ai_findings=len(
                ai_findings
            ),
            priorities=list(
                ai_result.priorities
            ),
            budget_results=dict(
                ai_result.budget_results
            ),
            static_failed=static_failed,
            ai_failed=ai_failed,
        )

    # ==================================================================
    # Context budget persistence
    # ==================================================================

    async def _persist_context_budget(
        self,
        db: AsyncSession,
        review_id: int,
        priorities: list[FilePriority],
        budget_results: dict[str, BudgetResult],
    ) -> None:
        """
        Persist context-budget information into the Review JSONB field.

        The pipeline does not commit the transaction. The caller
        remains responsible for the final transaction commit.
        """

        if not budget_results and not priorities:
            logger.debug(
                "No context budget data to persist for review %s",
                review_id,
            )
            return

        result = await db.execute(
            select(Review).where(
                Review.id == review_id
            )
        )

        review = result.scalar_one_or_none()

        if review is None:
            logger.warning(
                "Review %s not found while persisting "
                "context budget",
                review_id,
            )
            return

        budgets: dict[str, Any] = {}

        # --------------------------------------------------------------
        # Serialize individual budget results
        # --------------------------------------------------------------

        for key, budget in budget_results.items():
            budgets[key] = {
                "current_file": self._serialize_budgeted_file(
                    budget.current_file
                ),
                "related_files": [
                    self._serialize_budgeted_file(
                        file
                    )
                    for file in budget.related_files
                ],
                "total_characters": (
                    budget.total_characters
                ),
                "total_estimated_tokens": (
                    budget.total_estimated_tokens
                ),
                "files_dropped": list(
                    budget.dropped_files
                ),
            }

        # --------------------------------------------------------------
        # Serialize priorities
        # --------------------------------------------------------------

        serialized_priorities = [
            self._serialize_priority(
                priority
            )
            for priority in priorities
        ]

        # --------------------------------------------------------------
        # Calculate aggregate totals
        #
        # Budget results are created per current file.
        # Therefore we deduplicate files by path before
        # calculating aggregate totals.
        # --------------------------------------------------------------

        unique_files: dict[str, dict[str, Any]] = {}

        total_dropped: set[str] = set()

        for budget in budget_results.values():
            current = budget.current_file

            self._add_unique_budget_file(
                unique_files=unique_files,
                file=current,
            )

            for related_file in budget.related_files:
                self._add_unique_budget_file(
                    unique_files=unique_files,
                    file=related_file,
                )

            total_dropped.update(
                budget.dropped_files
            )

        total_characters = sum(
            int(item["characters"])
            for item in unique_files.values()
        )

        total_estimated_tokens = sum(
            int(item["estimated_tokens"])
            for item in unique_files.values()
        )

        files_truncated = sum(
            1
            for item in unique_files.values()
            if item["truncated"]
        )

        files_included = len(
            unique_files
        )

        context_budget = {
            "total_characters": total_characters,
            "total_estimated_tokens": (
                total_estimated_tokens
            ),
            "files_included": files_included,
            "files_dropped": len(
                total_dropped
            ),
            "files_truncated": files_truncated,
            "priorities": serialized_priorities,
            "budgets": budgets,
        }

        review.context_budget = context_budget

        await db.flush()

        logger.info(
            "Persisted context budget for review %s | "
            "included=%d | dropped=%d | truncated=%d | "
            "characters=%d | tokens=%d",
            review_id,
            files_included,
            len(total_dropped),
            files_truncated,
            total_characters,
            total_estimated_tokens,
        )

    @staticmethod
    def _serialize_budgeted_file(
        file: Any,
    ) -> dict[str, Any]:
        """
        Convert a BudgetedFile into JSON-safe data.
        """

        return {
            "path": file.path,
            "language": file.language,
            "characters": file.character_count,
            "estimated_tokens": (
                file.estimated_tokens
            ),
            "original_characters": (
                file.original_characters
            ),
            "truncated": file.truncated,
        }

    @staticmethod
    def _serialize_priority(
        priority: FilePriority,
    ) -> dict[str, Any]:
        """
        Convert FilePriority into JSON-safe data.
        """

        tier = getattr(
            priority,
            "tier",
            "",
        )

        if hasattr(tier, "value"):
            tier = tier.value

        return {
            "path": getattr(
                priority,
                "path",
                "",
            ),
            "score": float(
                getattr(
                    priority,
                    "score",
                    0.0,
                )
            ),
            "tier": str(tier),
            "import_score": float(
                getattr(
                    priority,
                    "import_score",
                    0.0,
                )
            ),
            "static_finding_score": float(
                getattr(
                    priority,
                    "static_finding_score",
                    0.0,
                )
            ),
            "size_score": float(
                getattr(
                    priority,
                    "size_score",
                    0.0,
                )
            ),
            "language_score": float(
                getattr(
                    priority,
                    "language_score",
                    0.0,
                )
            ),
            "dependency_score": float(
                getattr(
                    priority,
                    "dependency_score",
                    0.0,
                )
            ),
            "reason": str(
                getattr(
                    priority,
                    "reason",
                    "",
                )
            ),
        }

    @staticmethod
    def _add_unique_budget_file(
        unique_files: dict[str, dict[str, Any]],
        file: Any,
    ) -> None:
        """
        Add a budgeted file once when calculating aggregate
        context statistics.
        """

        path = str(
            getattr(
                file,
                "path",
                "",
            )
        )

        if not path:
            return

        current = {
            "path": path,
            "language": str(
                getattr(
                    file,
                    "language",
                    "",
                )
            ),
            "characters": int(
                getattr(
                    file,
                    "character_count",
                    0,
                )
            ),
            "estimated_tokens": int(
                getattr(
                    file,
                    "estimated_tokens",
                    0,
                )
            ),
            "original_characters": int(
                getattr(
                    file,
                    "original_characters",
                    0,
                )
            ),
            "truncated": bool(
                getattr(
                    file,
                    "truncated",
                    False,
                )
            ),
        }

        existing = unique_files.get(
            path
        )

        if existing is None:
            unique_files[path] = current
            return

        # Keep the largest representation if a file appears
        # in multiple per-file budgets.
        if (
            current["characters"]
            > existing["characters"]
        ):
            unique_files[path] = current

    # ==================================================================
    # Score calculation
    # ==================================================================

    @staticmethod
    def calculate_score(
        findings: list[AIFinding],
    ) -> float:
        """
        Calculate the final review score.

        Starting score:

            100

        Penalties:

            critical = 30
            high     = 15
            medium   = 7
            low      = 2

        Each penalty is weighted by finding confidence.

        The final score is always clamped between 0 and 100.
        """

        penalties: dict[str, float] = {
            "critical": 30.0,
            "high": 15.0,
            "medium": 7.0,
            "low": 2.0,
        }

        score = 100.0

        for finding in findings:
            severity = (
                finding.severity
                .strip()
                .lower()
            )

            penalty = penalties.get(
                severity,
                0.0,
            )

            confidence = (
                finding.confidence
                if finding.confidence is not None
                else 0.0
            )

            confidence = max(
                0.0,
                min(
                    1.0,
                    confidence,
                ),
            )

            score -= (
                penalty
                * confidence
            )

        score = max(
            0.0,
            min(
                100.0,
                score,
            ),
        )

        return round(
            score,
            2,
        )