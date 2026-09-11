from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from app.schemas.ai_finding import AIFinding
from app.services.context_prioritizer import PriorityTier
from app.services.review_orchestrator import (
    ReviewFile,
    ReviewOrchestrator,
)
from app.services.static_analysis.models import StaticFinding


@pytest.fixture
def ai_service() -> AsyncMock:
    service = AsyncMock()

    service.review_file = AsyncMock(
        side_effect=[
            [
                AIFinding(
                    severity="high",
                    category="security",
                    title="Missing authorization check",
                    description=(
                        "The endpoint can be reached without "
                        "verifying the user's permissions."
                    ),
                    file="app/api/users.py",
                    line=10,
                    why_it_matters=(
                        "Unauthorized users may access protected data."
                    ),
                    suggested_fix=(
                        "Validate the user's authorization before "
                        "executing the operation."
                    ),
                    fixed_code="",
                    confidence=0.95,
                )
            ],
            [],
        ]
    )

    return service


def get_call_for_path(
    ai_service: AsyncMock,
    path: str,
):
    """
    Find the AI review call for a specific file.

    Phase 7.5 reviews files according to priority rather
    than preserving the original input order.
    """
    for call in ai_service.review_file.call_args_list:
        if call.kwargs["path"] == path:
            return call

    raise AssertionError(
        f"No AI review call found for file: {path}"
    )


@pytest.mark.asyncio
async def test_multi_file_review_passes_project_context(
    ai_service: AsyncMock,
) -> None:
    orchestrator = ReviewOrchestrator(
        ai_service=ai_service
    )

    files = [
        ReviewFile(
            path="app/api/users.py",
            language="python",
            content=(
                "from app.services.auth import require_auth\n"
                "\n"
                "def get_user():\n"
                "    return user\n"
            ),
            imports=[
                "app/services/auth.py"
            ],
        ),
        ReviewFile(
            path="app/services/auth.py",
            language="python",
            content=(
                "def require_auth(user):\n"
                "    return user is not None\n"
            ),
        ),
    ]

    result = await orchestrator.review_files(
        files=files
    )

    assert result.files_analyzed == 2
    assert result.files_failed == 0
    assert len(result.findings) == 1

    assert ai_service.review_file.call_count == 2

    users_call = get_call_for_path(
        ai_service,
        "app/api/users.py",
    )

    assert users_call.kwargs["path"] == (
        "app/api/users.py"
    )

    assert (
        users_call.kwargs["project_context"]
        is not None
    )

    assert (
        "app/api/users.py"
        in users_call.kwargs["project_context"]
    )

    assert (
        "app/services/auth.py"
        in users_call.kwargs["project_context"]
    )


@pytest.mark.asyncio
async def test_related_files_are_passed_to_ai(
    ai_service: AsyncMock,
) -> None:
    # Three files are reviewed, so provide a safe
    # response for every call.
    ai_service.review_file = AsyncMock(
        return_value=[]
    )

    orchestrator = ReviewOrchestrator(
        ai_service=ai_service
    )

    files = [
        ReviewFile(
            path="app.py",
            language="python",
            content=(
                "from auth import login\n"
                "\n"
                "login()\n"
            ),
            imports=["auth.py"],
        ),
        ReviewFile(
            path="auth.py",
            language="python",
            content=(
                "def login():\n"
                "    return True\n"
            ),
        ),
        ReviewFile(
            path="database.py",
            language="python",
            content=(
                "def connect():\n"
                "    pass\n"
            ),
        ),
    ]

    await orchestrator.review_files(
        files=files
    )

    app_call = get_call_for_path(
        ai_service,
        "app.py",
    )

    related_files = (
        app_call.kwargs["related_files"]
    )

    assert len(related_files) == 1

    related_path = related_files[0][0]

    assert related_path == "auth.py"

    assert related_files[0][1] == (
        "def login():\n"
        "    return True\n"
    )

    assert related_files[0][2] == "python"


@pytest.mark.asyncio
async def test_static_findings_are_scoped_to_current_file(
    ai_service: AsyncMock,
) -> None:
    ai_service.review_file = AsyncMock(
        return_value=[]
    )

    orchestrator = ReviewOrchestrator(
        ai_service=ai_service
    )

    files = [
        ReviewFile(
            path="app.py",
            language="python",
            content="print('app')\n",
        ),
        ReviewFile(
            path="auth.py",
            language="python",
            content="print('auth')\n",
        ),
    ]

    static_findings = [
        StaticFinding(
            analyzer="ruff",
            severity="medium",
            category="quality",
            title="Unused variable",
            description="Variable is never used.",
            file="app.py",
            line=1,
        ),
        StaticFinding(
            analyzer="bandit",
            severity="high",
            category="security",
            title="Security issue",
            description="Potential security problem.",
            file="auth.py",
            line=1,
        ),
    ]

    await orchestrator.review_files(
        files=files,
        static_findings=static_findings,
    )

    app_call = get_call_for_path(
        ai_service,
        "app.py",
    )

    app_static_findings = (
        app_call.kwargs["static_findings"]
    )

    assert len(app_static_findings) == 1

    assert (
        app_static_findings[0].file
        == "app.py"
    )

    auth_call = get_call_for_path(
        ai_service,
        "auth.py",
    )

    auth_static_findings = (
        auth_call.kwargs["static_findings"]
    )

    assert len(auth_static_findings) == 1

    assert (
        auth_static_findings[0].file
        == "auth.py"
    )


@pytest.mark.asyncio
async def test_one_file_failure_does_not_stop_other_files(
    ai_service: AsyncMock,
) -> None:
    ai_service.review_file = AsyncMock(
        side_effect=[
            RuntimeError(
                "AI provider failed"
            ),
            [],
            [],
        ]
    )

    orchestrator = ReviewOrchestrator(
        ai_service=ai_service
    )

    files = [
        ReviewFile(
            path="first.py",
            language="python",
            content="print(1)\n",
        ),
        ReviewFile(
            path="second.py",
            language="python",
            content="print(2)\n",
        ),
        ReviewFile(
            path="third.py",
            language="python",
            content="print(3)\n",
        ),
    ]

    result = await orchestrator.review_files(
        files=files
    )

    assert result.files_analyzed == 2
    assert result.files_failed == 1

    assert (
        ai_service.review_file.call_count
        == 3
    )


@pytest.mark.asyncio
async def test_findings_from_multiple_files_are_preserved(
    ai_service: AsyncMock,
) -> None:
    first_finding = AIFinding(
        severity="medium",
        category="bug",
        title="Possible null access",
        description=(
            "The value may be null before use."
        ),
        file="app.py",
        line=4,
        why_it_matters=(
            "This may cause a runtime failure."
        ),
        suggested_fix=(
            "Validate the value before accessing it."
        ),
        fixed_code="",
        confidence=0.9,
    )

    second_finding = AIFinding(
        severity="high",
        category="security",
        title="Unsafe authorization",
        description=(
            "Authorization is not enforced."
        ),
        file="auth.py",
        line=8,
        why_it_matters=(
            "Unauthorized users may access resources."
        ),
        suggested_fix=(
            "Enforce authorization before returning the resource."
        ),
        fixed_code="",
        confidence=0.95,
    )

    ai_service.review_file = AsyncMock(
        side_effect=[
            [first_finding],
            [second_finding],
        ]
    )

    orchestrator = ReviewOrchestrator(
        ai_service=ai_service
    )

    files = [
        ReviewFile(
            path="app.py",
            language="python",
            content="print('app')\n",
        ),
        ReviewFile(
            path="auth.py",
            language="python",
            content="print('auth')\n",
        ),
    ]

    result = await orchestrator.review_files(
        files=files
    )

    assert len(result.findings) == 2

    assert {
        finding.file
        for finding in result.findings
    } == {
        "app.py",
        "auth.py",
    }


@pytest.mark.asyncio
async def test_empty_file_list_returns_empty_result(
    ai_service: AsyncMock,
) -> None:
    orchestrator = ReviewOrchestrator(
        ai_service=ai_service
    )

    result = await orchestrator.review_files(
        files=[]
    )

    assert result.findings == []
    assert result.files_analyzed == 0
    assert result.files_failed == 0
    assert result.priorities == []

    ai_service.review_file.assert_not_called()


@pytest.mark.asyncio
async def test_multi_file_review_returns_priorities(
    ai_service: AsyncMock,
) -> None:
    orchestrator = ReviewOrchestrator(
        ai_service=ai_service
    )

    files = [
        ReviewFile(
            path="app.py",
            language="python",
            content=(
                "from auth import login\n"
                "\n"
                "login()\n"
            ),
            imports=["auth.py"],
        ),
        ReviewFile(
            path="auth.py",
            language="python",
            content=(
                "def login():\n"
                "    return True\n"
            ),
        ),
    ]

    result = await orchestrator.review_files(
        files=files
    )

    assert len(result.priorities) == 2

    assert {
        priority.path
        for priority in result.priorities
    } == {
        "app.py",
        "auth.py",
    }

    scores = [
        priority.score
        for priority in result.priorities
    ]

    assert scores == sorted(
        scores,
        reverse=True,
    )

    for priority in result.priorities:
        assert 0 <= priority.score <= 100
        assert priority.tier is not None
        assert priority.reason


@pytest.mark.asyncio
async def test_priority_context_is_passed_to_ai(
    ai_service: AsyncMock,
) -> None:
    ai_service.review_file = AsyncMock(
        return_value=[]
    )

    orchestrator = ReviewOrchestrator(
        ai_service=ai_service
    )

    files = [
        ReviewFile(
            path="app.py",
            language="python",
            content=(
                "from auth import login\n"
                "\n"
                "login()\n"
            ),
            imports=["auth.py"],
        ),
        ReviewFile(
            path="auth.py",
            language="python",
            content=(
                "def login():\n"
                "    return True\n"
            ),
        ),
    ]

    result = await orchestrator.review_files(
        files=files
    )

    assert result.priorities

    first_call = (
        ai_service.review_file.call_args_list[0]
    )

    project_context = (
        first_call.kwargs["project_context"]
    )

    assert (
        "CURRENT FILE PRIORITY:"
        in project_context
    )

    assert "score:" in project_context
    assert "tier:" in project_context
    assert "reason:" in project_context
    assert "CONTEXT POLICY:" in project_context


@pytest.mark.asyncio
async def test_priority_tiers_are_valid(
    ai_service: AsyncMock,
) -> None:
    ai_service.review_file = AsyncMock(
        return_value=[]
    )

    orchestrator = ReviewOrchestrator(
        ai_service=ai_service
    )

    files = [
        ReviewFile(
            path="app.py",
            language="python",
            content="print('app')\n",
        ),
        ReviewFile(
            path="auth.py",
            language="python",
            content="print('auth')\n",
        ),
    ]

    result = await orchestrator.review_files(
        files=files
    )

    for priority in result.priorities:
        assert priority.tier in (
            PriorityTier.HIGH,
            PriorityTier.MEDIUM,
            PriorityTier.LOW,
        )
