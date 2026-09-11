
from app.services.context_prioritizer import (
    ContextPrioritizer,
    PriorityTier,
)
from app.services.review_context import ReviewContext


def build_context() -> ReviewContext:
    context = ReviewContext()

    context.add_file(
        path="src/main.py",
        language="python",
        content="from src.utils import helper\n",
        imports=["src/utils.py"],
        static_finding_count=0,
    )

    context.add_file(
        path="src/utils.py",
        language="python",
        content="def helper():\n    return True\n",
        imports=[],
        static_finding_count=3,
    )

    context.add_file(
        path="src/service.py",
        language="python",
        content=(
            "from src.utils.py import helper\n"
            "from src/main.py import app\n"
        ),
        imports=[
            "src/utils.py",
            "src/main.py",
        ],
        static_finding_count=1,
    )

    return context


def test_prioritize_returns_all_files() -> None:
    context = build_context()

    prioritizer = ContextPrioritizer()

    priorities = prioritizer.prioritize(context)

    assert len(priorities) == 3


def test_priorities_are_sorted_descending() -> None:
    context = build_context()

    prioritizer = ContextPrioritizer()

    priorities = prioritizer.prioritize(context)

    scores = [
        priority.score
        for priority in priorities
    ]

    assert scores == sorted(
        scores,
        reverse=True,
    )


def test_static_findings_increase_priority() -> None:
    context = ReviewContext()

    context.add_file(
        path="clean.py",
        language="python",
        content="print('hello')\n",
        static_finding_count=0,
    )

    context.add_file(
        path="problematic.py",
        language="python",
        content="print('hello')\n",
        static_finding_count=5,
    )

    prioritizer = ContextPrioritizer()

    priorities = prioritizer.prioritize(context)

    problematic = next(
        item
        for item in priorities
        if item.path == "problematic.py"
    )

    clean = next(
        item
        for item in priorities
        if item.path == "clean.py"
    )

    assert (
        problematic.static_finding_score
        > clean.static_finding_score
    )


def test_dependency_centrality_increases_priority() -> None:
    context = ReviewContext()

    context.add_file(
        path="core.py",
        language="python",
        content="def core():\n    pass\n",
    )

    context.add_file(
        path="service.py",
        language="python",
        content="from core import core\n",
        imports=["core.py"],
    )

    context.add_file(
        path="api.py",
        language="python",
        content="from core import core\n",
        imports=["core.py"],
    )

    prioritizer = ContextPrioritizer()

    priorities = prioritizer.prioritize(context)

    core = next(
        item
        for item in priorities
        if item.path == "core.py"
    )

    assert core.dependency_score == 100.0


def test_prioritized_files_preserves_context_objects() -> None:
    context = build_context()

    prioritizer = ContextPrioritizer()

    files = prioritizer.prioritized_files(
        context
    )

    assert len(files) == 3

    assert {
        file.path
        for file in files
    } == {
        "src/main.py",
        "src/utils.py",
        "src/service.py",
    }


def test_empty_context_returns_empty_result() -> None:
    context = ReviewContext()

    prioritizer = ContextPrioritizer()

    assert prioritizer.prioritize(context) == []

    assert (
        prioritizer.prioritized_files(
            context
        )
        == []
    )


def test_high_priority_tier() -> None:
    assert (
        ContextPrioritizer._get_priority_tier(70.0)
        == PriorityTier.HIGH
    )

    assert (
        ContextPrioritizer._get_priority_tier(95.0)
        == PriorityTier.HIGH
    )


def test_medium_priority_tier() -> None:
    assert (
        ContextPrioritizer._get_priority_tier(40.0)
        == PriorityTier.MEDIUM
    )

    assert (
        ContextPrioritizer._get_priority_tier(69.99)
        == PriorityTier.MEDIUM
    )


def test_low_priority_tier() -> None:
    assert (
        ContextPrioritizer._get_priority_tier(0.0)
        == PriorityTier.LOW
    )

    assert (
        ContextPrioritizer._get_priority_tier(39.99)
        == PriorityTier.LOW
    )


def test_get_priority_for_file() -> None:
    context = build_context()

    prioritizer = ContextPrioritizer()

    priority = prioritizer.get_priority(
        context,
        "src/utils.py",
    )

    assert priority is not None

    assert priority.path == "src/utils.py"

    assert 0 <= priority.score <= 100

    assert priority.tier in (
        PriorityTier.HIGH,
        PriorityTier.MEDIUM,
        PriorityTier.LOW,
    )


def test_get_priority_for_missing_file() -> None:
    context = build_context()

    prioritizer = ContextPrioritizer()

    priority = prioritizer.get_priority(
        context,
        "missing.py",
    )

    assert priority is None

