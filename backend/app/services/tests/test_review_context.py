from __future__ import annotations

from app.services.review_context import (
    ReviewContext,
)


def test_add_file_and_metadata() -> None:
    context = ReviewContext()

    context.add_file(
        path="app/services/auth.py",
        language="python",
        content=(
            "def login():\n"
            "    return True\n"
        ),
        imports=[
            "app.services.users",
        ],
        static_finding_count=2,
    )

    file_context = context.get_file(
        "app/services/auth.py"
    )

    assert file_context is not None
    assert file_context.path == (
        "app/services/auth.py"
    )
    assert file_context.language == "python"
    assert file_context.line_count == 2
    assert file_context.character_count > 0
    assert file_context.static_finding_count == 2
    assert file_context.imports == (
        "app.services.users",
    )


def test_get_missing_file_returns_none() -> None:
    context = ReviewContext()

    assert (
        context.get_file(
            "missing.py"
        )
        is None
    )


def test_related_files_are_detected() -> None:
    context = ReviewContext()

    context.add_file(
        path="app.py",
        language="python",
        content="from auth import login\n",
        imports=["auth.py"],
    )

    context.add_file(
        path="auth.py",
        language="python",
        content="def login():\n    pass\n",
        imports=[],
    )

    context.add_file(
        path="utils.py",
        language="python",
        content="def helper():\n    pass\n",
        imports=[],
    )

    related = context.related_files(
        "app.py"
    )

    assert len(related) == 1
    assert related[0].path == "auth.py"


def test_reverse_relationship_is_detected() -> None:
    context = ReviewContext()

    context.add_file(
        path="app.py",
        language="python",
        content="def app():\n    pass\n",
        imports=[],
    )

    context.add_file(
        path="auth.py",
        language="python",
        content="from app import app\n",
        imports=["app.py"],
    )

    related = context.related_files(
        "app.py"
    )

    assert len(related) == 1
    assert related[0].path == "auth.py"


def test_unrelated_files_are_not_returned() -> None:
    context = ReviewContext()

    context.add_file(
        path="app.py",
        language="python",
        content="print('app')\n",
        imports=["auth.py"],
    )

    context.add_file(
        path="auth.py",
        language="python",
        content="print('auth')\n",
        imports=[],
    )

    context.add_file(
        path="database.py",
        language="python",
        content="print('database')\n",
        imports=[],
    )

    related = context.related_files(
        "app.py"
    )

    assert [
        file.path
        for file in related
    ] == ["auth.py"]


def test_context_summary_contains_file_metadata() -> None:
    context = ReviewContext()

    context.add_file(
        path="app.py",
        language="python",
        content=(
            "from auth import login\n"
            "\n"
            "login()\n"
        ),
        imports=["auth.py"],
        static_finding_count=1,
    )

    context.add_file(
        path="auth.py",
        language="python",
        content=(
            "def login():\n"
            "    pass\n"
        ),
    )

    summary = context.build_summary(
        current_file="app.py"
    )

    assert "PROJECT CONTEXT:" in summary
    assert "app.py" in summary
    assert "auth.py" in summary
    assert "language=python" in summary
    assert "static_findings=1" in summary
    assert "[CURRENT FILE]" in summary
    assert "RELATED FILES:" in summary


def test_context_respects_max_files() -> None:
    context = ReviewContext(
        max_files=2
    )

    context.add_file(
        path="one.py",
        language="python",
        content="print(1)\n",
    )

    context.add_file(
        path="two.py",
        language="python",
        content="print(2)\n",
    )

    context.add_file(
        path="three.py",
        language="python",
        content="print(3)\n",
    )

    assert len(context.files) == 2

    assert (
        context.get_file("one.py")
        is not None
    )

    assert (
        context.get_file("two.py")
        is not None
    )

    assert (
        context.get_file("three.py")
        is None
    )


def test_empty_files_are_not_added() -> None:
    context = ReviewContext()

    context.add_file(
        path="empty.py",
        language="python",
        content="   \n",
    )

    assert context.files == []


def test_empty_path_is_not_added() -> None:
    context = ReviewContext()

    context.add_file(
        path="   ",
        language="python",
        content="print('hello')\n",
    )

    assert context.files == []


def test_total_lines_and_characters() -> None:
    context = ReviewContext()

    context.add_file(
        path="one.py",
        language="python",
        content="a\nb\n",
    )

    context.add_file(
        path="two.py",
        language="python",
        content="c\n",
    )

    assert context.total_lines == 3
    assert context.total_characters == 6


def test_summary_is_bounded() -> None:
    context = ReviewContext(
        max_context_characters=100
    )

    for index in range(10):
        context.add_file(
            path=f"very_long_file_{index}.py",
            language="python",
            content="print('hello')\n",
        )

    summary = context.build_summary()

    assert len(summary) <= 120
    assert "[Context truncated]" in summary