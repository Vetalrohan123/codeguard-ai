from __future__ import annotations

import logging
from dataclasses import dataclass, field

from app.schemas.ai_finding import AIFinding
from app.services.ai_review_service import (
    AIReviewError,
    AIReviewService,
)
from app.services.context_budget import (
    BudgetResult,
    ContextBudgetManager,
)
from app.services.context_prioritizer import (
    ContextPrioritizer,
    FilePriority,
    PriorityTier,
)
from app.services.review_context import (
    ReviewContext,
    ReviewFileContext,
)
from app.services.static_analysis.models import StaticFinding


logger = logging.getLogger(__name__)


@dataclass
class ReviewFile:
    """
    File participating in the multi-file review.
    """

    path: str
    content: str
    language: str
    imports: list[str] = field(
        default_factory=list
    )


@dataclass
class ReviewResult:
    """
    Result of reviewing multiple files.
    """

    findings: list[AIFinding] = field(
        default_factory=list
    )

    files_analyzed: int = 0

    files_failed: int = 0

    priorities: list[FilePriority] = field(
        default_factory=list
    )

    budget_results: dict[str, BudgetResult] = field(
        default_factory=dict
    )


class ReviewOrchestrator:
    """
    Coordinates AI review across multiple files.

    Responsibilities:

    - Build shared project context.
    - Calculate file priority.
    - Review high-priority files first.
    - Select related files.
    - Apply context/token budgets.
    - Preserve exact file paths.
    - Preserve imports and static-finding metadata.
    - Pass bounded context to the AI reviewer.
    - Continue reviewing other files if one file fails.
    """

    def __init__(
        self,
        ai_service: AIReviewService | None = None,
        prioritizer: ContextPrioritizer | None = None,
        budget_manager: ContextBudgetManager | None = None,
    ) -> None:
        self.ai_service = (
            ai_service
            or AIReviewService()
        )

        self.prioritizer = (
            prioritizer
            or ContextPrioritizer()
        )

        self.budget_manager = (
            budget_manager
            or ContextBudgetManager()
        )

    async def review_files(
        self,
        files: list[ReviewFile],
        static_findings: list[StaticFinding] | None = None,
    ) -> ReviewResult:
        """
        Review multiple files using prioritized,
        budgeted context.
        """

        static_findings = (
            static_findings or []
        )

        findings: list[AIFinding] = []

        files_analyzed = 0
        files_failed = 0

        if not files:
            return ReviewResult(
                findings=[],
                files_analyzed=0,
                files_failed=0,
                priorities=[],
                budget_results={},
            )

        context = self._build_context(
            files=files,
            static_findings=static_findings,
        )

        priorities = (
            self.prioritizer.prioritize(
                context
            )
        )

        file_map = {
            file.path: file
            for file in files
        }

        budget_results: dict[
            str,
            BudgetResult,
        ] = {}

        for priority in priorities:
            review_file = file_map.get(
                priority.path
            )

            if review_file is None:
                logger.warning(
                    "Priority references missing file | "
                    "file=%s",
                    priority.path,
                )
                continue

            file_static_findings = [
                finding
                for finding in static_findings
                if finding.file
                == review_file.path
            ]

            related_files = (
                context.related_files(
                    review_file.path
                )
            )

            try:
                (
                    file_findings,
                    budget_result,
                ) = await self._review_single_file(
                    review_file=review_file,
                    priority=priority,
                    context=context,
                    related_files=related_files,
                    static_findings=file_static_findings,
                )

                findings.extend(
                    file_findings
                )

                budget_results[
                    review_file.path
                ] = budget_result

                files_analyzed += 1

                logger.info(
                    "File review completed | "
                    "file=%s | priority=%.2f | "
                    "tier=%s | findings=%d | "
                    "related_files=%d | "
                    "dropped_files=%d",
                    review_file.path,
                    priority.score,
                    priority.tier.value,
                    len(file_findings),
                    len(
                        budget_result.related_files
                    ),
                    len(
                        budget_result.dropped_files
                    ),
                )

            except AIReviewError:
                files_failed += 1

                logger.exception(
                    "AI review failed for file %s",
                    review_file.path,
                )

            except Exception:
                files_failed += 1

                logger.exception(
                    "Unexpected AI review failure for file %s",
                    review_file.path,
                )

        logger.info(
            "Multi-file review completed | "
            "files=%d | analyzed=%d | failed=%d | "
            "findings=%d",
            len(files),
            files_analyzed,
            files_failed,
            len(findings),
        )

        return ReviewResult(
            findings=findings,
            files_analyzed=files_analyzed,
            files_failed=files_failed,
            priorities=priorities,
            budget_results=budget_results,
        )

    async def _review_single_file(
        self,
        review_file: ReviewFile,
        priority: FilePriority,
        context: ReviewContext,
        related_files: list[ReviewFileContext],
        static_findings: list[StaticFinding],
    ) -> tuple[
        list[AIFinding],
        BudgetResult,
    ]:
        """
        Review one file using its calculated priority
        and context budget.
        """

        current_context = (
            context.get_file(
                review_file.path
            )
        )

        if current_context is None:
            raise AIReviewError(
                "Current review file was not found "
                "in the review context."
            )

        selected_related_files = (
            self._select_related_files(
                related_files=related_files,
                priority=priority,
            )
        )

        budget_result = (
            self.budget_manager.build(
                current_file=current_context,
                related_files=selected_related_files,
                priority=priority,
            )
        )

        project_context = (
            self._build_project_context(
                context=context,
                current_file=review_file.path,
                priority=priority,
                budget_result=budget_result,
            )
        )

        logger.info(
            "Starting single-file AI review | "
            "file=%s | language=%s | "
            "priority=%.2f | tier=%s | "
            "current_chars=%d | "
            "current_tokens=%d | "
            "related_files=%d | "
            "dropped_files=%d",
            review_file.path,
            review_file.language,
            priority.score,
            priority.tier.value,
            budget_result.current_file.character_count,
            budget_result.current_file.estimated_tokens,
            len(
                budget_result.related_files
            ),
            len(
                budget_result.dropped_files
            ),
        )

        # Convert budgeted files into tuple-compatible
        # structures expected by the AI service/tests.
        #
        # Each tuple contains:
        # 0 -> path
        # 1 -> content
        # 2 -> language
        # 3 -> imports
        # 4 -> static finding count

        related_file_contexts = [
            (
                related.path,
                related.content,
                related.language,
                related.imports,
                getattr(
                    related,
                    "static_finding_count",
                    0,
                ),
            )
            for related in budget_result.related_files
        ]

        findings = await self.ai_service.review_file(
            path=review_file.path,
            content=(
                budget_result
                .current_file
                .content
            ),
            language=review_file.language,
            static_findings=static_findings,
            project_context=project_context,
            related_files=related_file_contexts,
        )

        return (
            findings,
            budget_result,
        )

    def _build_project_context(
        self,
        context: ReviewContext,
        current_file: str,
        priority: FilePriority,
        budget_result: BudgetResult,
    ) -> str:
        """
        Build project context with priority and
        budget information.
        """

        base_summary = (
            context.build_summary(
                current_file=current_file
            )
        )

        priority_information = (
            "\n\nCURRENT FILE PRIORITY:\n"
            f"- score: {priority.score}\n"
            f"- tier: {priority.tier.value}\n"
            f"- reason: {priority.reason}\n"
            f"- import_score: "
            f"{priority.import_score}\n"
            f"- static_finding_score: "
            f"{priority.static_finding_score}\n"
            f"- size_score: "
            f"{priority.size_score}\n"
            f"- language_score: "
            f"{priority.language_score}\n"
            f"- dependency_score: "
            f"{priority.dependency_score}"
        )

        budget_information = (
            "\n\nCONTEXT BUDGET:\n"
            f"- total_characters: "
            f"{budget_result.total_characters}\n"
            f"- total_estimated_tokens: "
            f"{budget_result.total_estimated_tokens}\n"
            f"- current_file_characters: "
            f"{budget_result.current_file.character_count}\n"
            f"- current_file_tokens: "
            f"{budget_result.current_file.estimated_tokens}\n"
            f"- current_file_original_characters: "
            f"{budget_result.current_file.original_characters}\n"
            f"- current_file_truncated: "
            f"{budget_result.current_file.truncated}\n"
            f"- related_files_included: "
            f"{len(budget_result.related_files)}\n"
            f"- related_files_dropped: "
            f"{len(budget_result.dropped_files)}"
        )

        if budget_result.dropped_files:
            budget_information += (
                "\n- dropped_files: "
                + ", ".join(
                    budget_result.dropped_files
                )
            )

        if priority.tier == PriorityTier.HIGH:
            context_instruction = (
                "\n\nCONTEXT POLICY:\n"
                "This file has HIGH review priority. "
                "Perform deep cross-file reasoning and "
                "pay special attention to dependency "
                "relationships."
            )

        elif priority.tier == PriorityTier.MEDIUM:
            context_instruction = (
                "\n\nCONTEXT POLICY:\n"
                "This file has MEDIUM review priority. "
                "Focus on the current file and its most "
                "relevant dependencies."
            )

        else:
            context_instruction = (
                "\n\nCONTEXT POLICY:\n"
                "This file has LOW review priority. "
                "Focus primarily on issues directly "
                "visible in the current file."
            )

        return (
            base_summary
            + priority_information
            + budget_information
            + context_instruction
        )

    @staticmethod
    def _select_related_files(
        related_files: list[ReviewFileContext],
        priority: FilePriority,
    ) -> list[ReviewFileContext]:
        """
        Select related files based on priority.

        HIGH:
            Up to 5 files.

        MEDIUM:
            Up to 3 files.

        LOW:
            Up to 1 file.
        """

        if not related_files:
            return []

        if priority.tier == PriorityTier.HIGH:
            limit = 5

        elif priority.tier == PriorityTier.MEDIUM:
            limit = 3

        else:
            limit = 1

        return related_files[:limit]

    @staticmethod
    def _build_context(
        files: list[ReviewFile],
        static_findings: list[StaticFinding],
    ) -> ReviewContext:
        """
        Build shared review context.
        """

        context = ReviewContext()

        for review_file in files:
            file_static_count = sum(
                1
                for finding in static_findings
                if finding.file
                == review_file.path
            )

            context.add_file(
                path=review_file.path,
                language=review_file.language,
                content=review_file.content,
                imports=list(
                    review_file.imports
                ),
                static_finding_count=(
                    file_static_count
                ),
            )

        return context