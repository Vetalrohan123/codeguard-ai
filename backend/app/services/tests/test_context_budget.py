from __future__ import annotations

from app.services.context_budget import (
    ContextBudget,
    ContextBudgetManager,
)
from app.services.context_prioritizer import (
    FilePriority,
    PriorityTier,
)
from app.services.review_context import (
    ReviewContext,
)


def build_priority(
    tier: PriorityTier = PriorityTier.HIGH,
    score: float = 80.0,
) -> FilePriority:
    return FilePriority(
        path="app/main.py",
        score=score,
        tier=tier,
        import_score=80.0,
        static_finding_score=80.0,
        size_score=80.0,
        language_score=100.0,
        dependency_score=80.0,
        reason="test priority",
    )


def build_file(
    path: str,
    content: str,
    language: str = "python",
    imports: list[str] | None = None,
    static_finding_count: int = 0,
):
    context = ReviewContext()

    context.add_file(
        path=path,
        language=language,
        content=content,
        imports=imports or [],
        static_finding_count=static_finding_count,
    )

    return context.files[0]


def test_current_file_is_preserved() -> None:
    manager = ContextBudgetManager(
        ContextBudget(
            max_total_characters=1000,
            max_current_file_characters=500,
            max_related_file_characters=200,
            max_related_files=5,
        )
    )

    current_file = build_file(
        path="app/main.py",
        content="print('hello')",
    )

    result = manager.build(
        current_file=current_file,
        related_files=[],
        priority=build_priority(),
    )

    assert result.current_file.path == "app/main.py"
    assert result.current_file.content == "print('hello')"
    assert result.current_file.truncated is False


def test_related_files_are_included() -> None:
    manager = ContextBudgetManager(
        ContextBudget(
            max_total_characters=2000,
            max_current_file_characters=500,
            max_related_file_characters=500,
            max_related_files=5,
        )
    )

    current_file = build_file(
        path="app/main.py",
        content="main",
    )

    related_files = [
        build_file(
            path="app/service.py",
            content="service",
        ),
        build_file(
            path="app/utils.py",
            content="utils",
        ),
    ]

    result = manager.build(
        current_file=current_file,
        related_files=related_files,
        priority=build_priority(),
    )

    assert len(result.related_files) == 2
    assert result.related_files[0].path == "app/service.py"
    assert result.related_files[1].path == "app/utils.py"


def test_related_file_is_truncated() -> None:
    manager = ContextBudgetManager(
        ContextBudget(
            max_total_characters=2000,
            max_current_file_characters=500,
            max_related_file_characters=10,
            max_related_files=5,
        )
    )

    current_file = build_file(
        path="app/main.py",
        content="main",
    )

    related_file = build_file(
        path="app/service.py",
        content="12345678901234567890",
    )

    result = manager.build(
        current_file=current_file,
        related_files=[related_file],
        priority=build_priority(),
    )

    assert len(result.related_files) == 1
    assert result.related_files[0].character_count == 10
    assert result.related_files[0].truncated is True
    assert result.related_files[0].original_characters == 20


def test_total_character_budget_is_respected() -> None:
    manager = ContextBudgetManager(
        ContextBudget(
            max_total_characters=100,
            max_current_file_characters=60,
            max_related_file_characters=60,
            max_related_files=5,
        )
    )

    current_file = build_file(
        path="app/main.py",
        content="a" * 60,
    )

    related_files = [
        build_file(
            path="app/service.py",
            content="b" * 60,
        ),
        build_file(
            path="app/utils.py",
            content="c" * 60,
        ),
    ]

    result = manager.build(
        current_file=current_file,
        related_files=related_files,
        priority=build_priority(),
    )

    assert result.total_characters <= 100
    assert result.current_file.character_count == 60


def test_high_priority_allows_five_related_files() -> None:
    manager = ContextBudgetManager(
        ContextBudget(
            max_total_characters=10_000,
            max_current_file_characters=500,
            max_related_file_characters=500,
            max_related_files=5,
        )
    )

    current_file = build_file(
        path="app/main.py",
        content="main",
    )

    related_files = [
        build_file(
            path=f"app/file{i}.py",
            content=f"file{i}",
        )
        for i in range(5)
    ]

    result = manager.build(
        current_file=current_file,
        related_files=related_files,
        priority=build_priority(
            PriorityTier.HIGH
        ),
    )

    assert len(result.related_files) == 5


def test_medium_priority_allows_three_related_files() -> None:
    manager = ContextBudgetManager(
        ContextBudget(
            max_total_characters=10_000,
            max_current_file_characters=500,
            max_related_file_characters=500,
            max_related_files=5,
        )
    )

    current_file = build_file(
        path="app/main.py",
        content="main",
    )

    related_files = [
        build_file(
            path=f"app/file{i}.py",
            content=f"file{i}",
        )
        for i in range(5)
    ]

    result = manager.build(
        current_file=current_file,
        related_files=related_files,
        priority=build_priority(
            PriorityTier.MEDIUM
        ),
    )

    assert len(result.related_files) == 3


def test_low_priority_allows_one_related_file() -> None:
    manager = ContextBudgetManager(
        ContextBudget(
            max_total_characters=10_000,
            max_current_file_characters=500,
            max_related_file_characters=500,
            max_related_files=5,
        )
    )

    current_file = build_file(
        path="app/main.py",
        content="main",
    )

    related_files = [
        build_file(
            path=f"app/file{i}.py",
            content=f"file{i}",
        )
        for i in range(5)
    ]

    result = manager.build(
        current_file=current_file,
        related_files=related_files,
        priority=build_priority(
            PriorityTier.LOW
        ),
    )

    assert len(result.related_files) == 1


def test_dropped_files_are_reported() -> None:
    manager = ContextBudgetManager(
        ContextBudget(
            max_total_characters=1000,
            max_current_file_characters=500,
            max_related_file_characters=100,
            max_related_files=1,
        )
    )

    current_file = build_file(
        path="app/main.py",
        content="main",
    )

    related_files = [
        build_file(
            path="app/service.py",
            content="service",
        ),
        build_file(
            path="app/utils.py",
            content="utils",
        ),
    ]

    result = manager.build(
        current_file=current_file,
        related_files=related_files,
        priority=build_priority(
            PriorityTier.LOW
        ),
    )

    assert len(result.related_files) == 1
    assert "app/utils.py" in result.dropped_files


def test_current_file_is_truncated_when_too_large() -> None:
    manager = ContextBudgetManager(
        ContextBudget(
            max_total_characters=2000,
            max_current_file_characters=100,
            max_related_file_characters=200,
            max_related_files=5,
        )
    )

    current_file = build_file(
        path="app/main.py",
        content="a" * 500,
    )

    result = manager.build(
        current_file=current_file,
        related_files=[],
        priority=build_priority(),
    )

    assert result.current_file.character_count == 100
    assert result.current_file.truncated is True
    assert result.current_file.original_characters == 500


def test_directly_imported_file_is_prioritized() -> None:
    manager = ContextBudgetManager(
        ContextBudget(
            max_total_characters=5000,
            max_current_file_characters=500,
            max_related_file_characters=500,
            max_related_files=1,
        )
    )

    current_file = build_file(
        path="app/main.py",
        content="main",
        imports=["app/service.py"],
    )

    unrelated_file = build_file(
        path="app/utils.py",
        content="utils",
    )

    imported_file = build_file(
        path="app/service.py",
        content="service",
    )

    result = manager.build(
        current_file=current_file,
        related_files=[
            unrelated_file,
            imported_file,
        ],
        priority=build_priority(
            PriorityTier.LOW
        ),
    )

    assert len(result.related_files) == 1
    assert result.related_files[0].path == "app/service.py"


def test_file_importing_current_file_is_prioritized() -> None:
    manager = ContextBudgetManager(
        ContextBudget(
            max_total_characters=5000,
            max_current_file_characters=500,
            max_related_file_characters=500,
            max_related_files=1,
        )
    )

    current_file = build_file(
        path="app/service.py",
        content="service",
    )

    unrelated_file = build_file(
        path="app/utils.py",
        content="utils",
    )

    dependent_file = build_file(
        path="app/controller.py",
        content="controller",
        imports=["app/service.py"],
    )

    result = manager.build(
        current_file=current_file,
        related_files=[
            unrelated_file,
            dependent_file,
        ],
        priority=build_priority(
            PriorityTier.LOW
        ),
    )

    assert len(result.related_files) == 1
    assert result.related_files[0].path == "app/controller.py"


def test_dependency_ranking_preserves_stable_order() -> None:
    manager = ContextBudgetManager(
        ContextBudget(
            max_total_characters=5000,
            max_current_file_characters=500,
            max_related_file_characters=500,
            max_related_files=5,
        )
    )

    current_file = build_file(
        path="app/main.py",
        content="main",
    )

    first = build_file(
        path="app/first.py",
        content="first",
    )

    second = build_file(
        path="app/second.py",
        content="second",
    )

    third = build_file(
        path="app/third.py",
        content="third",
    )

    result = manager.build(
        current_file=current_file,
        related_files=[
            first,
            second,
            third,
        ],
        priority=build_priority(
            PriorityTier.HIGH
        ),
    )

    assert [
        file.path
        for file in result.related_files
    ] == [
        "app/first.py",
        "app/second.py",
        "app/third.py",
    ]


def test_token_budget_is_respected() -> None:
    manager = ContextBudgetManager(
        ContextBudget(
            max_total_characters=10_000,
            max_current_file_characters=500,
            max_related_file_characters=5000,
            max_related_files=5,
            max_total_tokens=100,
        )
    )

    current_file = build_file(
        path="app/main.py",
        content="a" * 200,
    )

    related_files = [
        build_file(
            path="app/service.py",
            content="b" * 5000,
        ),
    ]

    result = manager.build(
        current_file=current_file,
        related_files=related_files,
        priority=build_priority(),
    )

    assert result.total_estimated_tokens <= 100


def test_budget_result_contains_token_count() -> None:
    manager = ContextBudgetManager(
        ContextBudget(
            max_total_characters=1000,
            max_current_file_characters=500,
            max_related_file_characters=200,
            max_related_files=5,
            max_total_tokens=250,
        )
    )

    current_file = build_file(
        path="app/main.py",
        content="a" * 100,
    )

    result = manager.build(
        current_file=current_file,
        related_files=[],
        priority=build_priority(),
    )

    assert result.total_estimated_tokens == 25
    assert result.current_file.estimated_tokens == 25


def test_related_file_contains_token_estimate() -> None:
    manager = ContextBudgetManager(
        ContextBudget(
            max_total_characters=1000,
            max_current_file_characters=500,
            max_related_file_characters=200,
            max_related_files=5,
            max_total_tokens=250,
        )
    )

    current_file = build_file(
        path="app/main.py",
        content="main",
    )

    related_file = build_file(
        path="app/service.py",
        content="a" * 100,
    )

    result = manager.build(
        current_file=current_file,
        related_files=[related_file],
        priority=build_priority(),
    )

    assert len(result.related_files) == 1
    assert (
        result.related_files[0].estimated_tokens
        == 25
    )


def test_current_file_token_budget_is_respected() -> None:
    manager = ContextBudgetManager(
        ContextBudget(
            max_total_characters=10_000,
            max_current_file_characters=5_000,
            max_related_file_characters=1_000,
            max_related_files=5,
            max_total_tokens=100,
        )
    )

    current_file = build_file(
        path="app/main.py",
        content="a" * 5_000,
    )

    result = manager.build(
        current_file=current_file,
        related_files=[],
        priority=build_priority(),
    )

    assert result.total_estimated_tokens <= 100
    assert result.current_file.estimated_tokens <= 100
    assert result.current_file.truncated is True


def test_token_budget_can_drop_all_related_files() -> None:
    manager = ContextBudgetManager(
        ContextBudget(
            max_total_characters=10_000,
            max_current_file_characters=1_000,
            max_related_file_characters=5_000,
            max_related_files=5,
            max_total_tokens=25,
        )
    )

    current_file = build_file(
        path="app/main.py",
        content="a" * 100,
    )

    related_files = [
        build_file(
            path="app/service.py",
            content="b" * 5_000,
        ),
        build_file(
            path="app/utils.py",
            content="c" * 5_000,
        ),
    ]

    result = manager.build(
        current_file=current_file,
        related_files=related_files,
        priority=build_priority(
            PriorityTier.HIGH
        ),
    )

    assert result.total_estimated_tokens <= 25
    assert result.current_file.estimated_tokens <= 25
    assert result.related_files == []


def test_character_and_token_budget_are_both_respected() -> None:
    manager = ContextBudgetManager(
        ContextBudget(
            max_total_characters=300,
            max_current_file_characters=200,
            max_related_file_characters=200,
            max_related_files=5,
            max_total_tokens=50,
        )
    )

    current_file = build_file(
        path="app/main.py",
        content="a" * 200,
    )

    related_file = build_file(
        path="app/service.py",
        content="b" * 200,
    )

    result = manager.build(
        current_file=current_file,
        related_files=[related_file],
        priority=build_priority(),
    )

    assert result.total_characters <= 300
    assert result.total_estimated_tokens <= 50


def test_budget_preserves_current_file_before_related_files() -> None:
    manager = ContextBudgetManager(
        ContextBudget(
            max_total_characters=250,
            max_current_file_characters=200,
            max_related_file_characters=200,
            max_related_files=5,
            max_total_tokens=100,
        )
    )

    current_file = build_file(
        path="app/main.py",
        content="a" * 200,
    )

    related_file = build_file(
        path="app/service.py",
        content="b" * 200,
    )

    result = manager.build(
        current_file=current_file,
        related_files=[related_file],
        priority=build_priority(),
    )

    assert result.current_file.character_count == 200
    assert result.total_characters <= 250
    assert result.total_estimated_tokens <= 100


def test_dropped_files_include_files_excluded_by_priority_limit() -> None:
    manager = ContextBudgetManager(
        ContextBudget(
            max_total_characters=10_000,
            max_current_file_characters=500,
            max_related_file_characters=500,
            max_related_files=1,
            max_total_tokens=5_000,
        )
    )

    current_file = build_file(
        path="app/main.py",
        content="main",
    )

    related_files = [
        build_file(
            path="app/service.py",
            content="service",
        ),
        build_file(
            path="app/utils.py",
            content="utils",
        ),
    ]

    result = manager.build(
        current_file=current_file,
        related_files=related_files,
        priority=build_priority(
            PriorityTier.HIGH
        ),
    )

    assert len(result.related_files) == 1
    assert len(result.dropped_files) == 1
    assert result.dropped_files[0] == "app/utils.py"