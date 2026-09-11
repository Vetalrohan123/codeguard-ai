from __future__ import annotations

from app.schemas.context_budget import (
    ContextBudgetResponse,
    ContextFileBudgetResponse,
    ContextPriorityResponse,
    ReviewContextBudgetResponse,
)


def test_context_file_budget_response() -> None:
    response = ContextFileBudgetResponse(
        path="app/main.py",
        language="python",
        characters=1000,
        estimated_tokens=250,
        original_characters=2000,
        truncated=True,
    )

    assert response.path == "app/main.py"
    assert response.language == "python"
    assert response.characters == 1000
    assert response.estimated_tokens == 250
    assert response.original_characters == 2000
    assert response.truncated is True


def test_context_budget_response() -> None:
    current_file = ContextFileBudgetResponse(
        path="app/main.py",
        language="python",
        characters=1000,
        estimated_tokens=250,
        original_characters=1000,
        truncated=False,
    )

    related_file = ContextFileBudgetResponse(
        path="app/service.py",
        language="python",
        characters=500,
        estimated_tokens=125,
        original_characters=500,
        truncated=False,
    )

    response = ContextBudgetResponse(
        current_file=current_file,
        related_files=[related_file],
        total_characters=1500,
        total_estimated_tokens=375,
        dropped_files=["app/utils.py"],
    )

    assert response.total_characters == 1500
    assert response.total_estimated_tokens == 375
    assert len(response.related_files) == 1
    assert response.dropped_files == [
        "app/utils.py"
    ]


def test_context_priority_response() -> None:
    response = ContextPriorityResponse(
        path="app/main.py",
        score=85.5,
        tier="high",
        import_score=80.0,
        static_finding_score=90.0,
        size_score=70.0,
        language_score=100.0,
        dependency_score=85.0,
        reason="strong dependency centrality",
    )

    assert response.path == "app/main.py"
    assert response.score == 85.5
    assert response.tier == "high"
    assert response.dependency_score == 85.0


def test_review_context_budget_response() -> None:
    response = ReviewContextBudgetResponse(
        total_characters=5000,
        total_estimated_tokens=1250,
        files_included=4,
        files_dropped=2,
        files_truncated=1,
        priorities=[],
        budgets={},
    )

    assert response.total_characters == 5000
    assert response.total_estimated_tokens == 1250
    assert response.files_included == 4
    assert response.files_dropped == 2
    assert response.files_truncated == 1
    assert response.priorities == []
    assert response.budgets == {}