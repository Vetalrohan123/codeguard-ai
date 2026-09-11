from __future__ import annotations

from app.schemas.context_budget import (
    ContextBudgetResponse,
    ContextFileBudgetResponse,
    ContextPriorityResponse,
    ReviewContextBudgetResponse,
)
from app.services.context_budget import (
    BudgetResult,
)
from app.services.context_prioritizer import (
    FilePriority,
)


def budgeted_file_to_response(
    file,
) -> ContextFileBudgetResponse:
    return ContextFileBudgetResponse(
        path=file.path,
        language=file.language,
        characters=file.character_count,
        estimated_tokens=file.estimated_tokens,
        original_characters=file.original_characters,
        truncated=file.truncated,
    )


def budget_result_to_response(
    result: BudgetResult,
) -> ContextBudgetResponse:
    return ContextBudgetResponse(
        current_file=budgeted_file_to_response(
            result.current_file
        ),
        related_files=[
            budgeted_file_to_response(file)
            for file in result.related_files
        ],
        total_characters=result.total_characters,
        total_estimated_tokens=(
            result.total_estimated_tokens
        ),
        dropped_files=list(result.dropped_files),
    )


def priority_to_response(
    priority: FilePriority,
) -> ContextPriorityResponse:
    return ContextPriorityResponse(
        path=priority.path,
        score=priority.score,
        tier=priority.tier.value,
        import_score=priority.import_score,
        static_finding_score=(
            priority.static_finding_score
        ),
        size_score=priority.size_score,
        language_score=priority.language_score,
        dependency_score=priority.dependency_score,
        reason=priority.reason,
    )


def build_context_budget_response(
    priorities: list[FilePriority],
    budget_results: dict[str, BudgetResult],
) -> ReviewContextBudgetResponse:
    total_characters = sum(
        result.total_characters
        for result in budget_results.values()
    )

    total_estimated_tokens = sum(
        result.total_estimated_tokens
        for result in budget_results.values()
    )

    files_included = 0
    files_dropped = 0
    files_truncated = 0

    for result in budget_results.values():
        files_included += 1

        files_included += len(
            result.related_files
        )

        files_dropped += len(
            result.dropped_files
        )

        if result.current_file.truncated:
            files_truncated += 1

        files_truncated += sum(
            1
            for file in result.related_files
            if file.truncated
        )

    return ReviewContextBudgetResponse(
        total_characters=total_characters,
        total_estimated_tokens=(
            total_estimated_tokens
        ),
        files_included=files_included,
        files_dropped=files_dropped,
        files_truncated=files_truncated,
        priorities=[
            priority_to_response(priority)
            for priority in priorities
        ],
        budgets={
            path: budget_result_to_response(result)
            for path, result in budget_results.items()
        },
    )