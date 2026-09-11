from unittest.mock import AsyncMock, MagicMock

import pytest

from app.schemas.ai_finding import AIFinding
from app.services.review_orchestrator import ReviewResult
from app.services.review_pipeline import PipelineFile, ReviewPipeline
from app.services.static_analysis.models import StaticFinding


def create_fake_db():
    """
    Create a SQLAlchemy-like async session mock.

    SQLAlchemy AsyncSession methods such as flush(),
    commit(), and rollback() are awaited.

    db.add() is synchronous, so it must be a MagicMock.
    """
    db = MagicMock()

    db.flush = AsyncMock()
    db.commit = AsyncMock()
    db.rollback = AsyncMock()

    return db


class SuccessfulStaticAnalyzer:
    async def analyze_files(self, files):
        return [
            StaticFinding(
                analyzer="eslint",
                severity="low",
                category="quality",
                title="ESLint: no-console",
                description="Unexpected console statement.",
                file="src/App.jsx",
                line=7,
                confidence=0.98,
            )
        ]


class SuccessfulOrchestrator:
    async def review_files(
        self,
        files,
        static_findings=None,
    ):
        """
        Mock AI orchestrator.

        static_findings is accepted because the real orchestrator
        receives static-analysis findings as contextual evidence.
        """
        return ReviewResult(
            findings=[
                AIFinding(
                    severity="low",
                    category="quality",
                    title="Console logging",
                    description="Debug logging is present.",
                    file="src/App.jsx",
                    line=7,
                    why_it_matters="Debug logging should be removed.",
                    suggested_fix="Remove console.log.",
                    fixed_code="",
                    confidence=0.95,
                )
            ],
            files_analyzed=1,
            files_failed=0,
        )


class FailingStaticAnalyzer:
    async def analyze_files(self, files):
        raise RuntimeError("Static analyzer crashed")


class FailingOrchestrator:
    async def review_files(
        self,
        files,
        static_findings=None,
    ):
        """
        Simulate an unavailable AI provider.
        """
        raise RuntimeError("AI provider unavailable")


@pytest.mark.asyncio
async def test_pipeline_does_not_commit():
    db = create_fake_db()

    pipeline = ReviewPipeline(
        orchestrator=SuccessfulOrchestrator(),
        static_analysis_service=SuccessfulStaticAnalyzer(),
    )

    result = await pipeline.run(
        db=db,
        review_id=1,
        files=[
            PipelineFile(
                path="src/App.jsx",
                content="console.log('test');",
            )
        ],
    )

    assert result.ai_failed is False
    assert result.static_failed is False

    db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_static_failure_does_not_fail_entire_pipeline():
    db = create_fake_db()

    pipeline = ReviewPipeline(
        orchestrator=SuccessfulOrchestrator(),
        static_analysis_service=FailingStaticAnalyzer(),
    )

    result = await pipeline.run(
        db=db,
        review_id=1,
        files=[
            PipelineFile(
                path="src/App.jsx",
                content="console.log('test');",
            )
        ],
    )

    assert result.static_failed is True
    assert result.ai_failed is False

    assert result.files_analyzed == 1

    # Static analysis failed, but AI review
    # still completed successfully.
    assert result.files_failed == 0

    # Pipeline must never commit.
    db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_ai_failure_is_recorded():
    db = create_fake_db()

    pipeline = ReviewPipeline(
        orchestrator=FailingOrchestrator(),
        static_analysis_service=SuccessfulStaticAnalyzer(),
    )

    result = await pipeline.run(
        db=db,
        review_id=1,
        files=[
            PipelineFile(
                path="src/App.jsx",
                content="console.log('test');",
            )
        ],
    )

    assert result.ai_failed is True
    assert result.static_failed is False

    assert result.files_failed == 1

    # Pipeline itself must not commit.
    db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_pipeline_flushes_but_does_not_commit():
    db = create_fake_db()

    pipeline = ReviewPipeline(
        orchestrator=SuccessfulOrchestrator(),
        static_analysis_service=SuccessfulStaticAnalyzer(),
    )

    await pipeline.run(
        db=db,
        review_id=1,
        files=[
            PipelineFile(
                path="src/App.jsx",
                content="console.log('test');",
            )
        ],
    )

    # Findings are persisted through the session,
    # so flush must happen.
    db.flush.assert_awaited()

    # Transaction ownership belongs to the API route.
    db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_pipeline_does_not_rollback():
    db = create_fake_db()

    pipeline = ReviewPipeline(
        orchestrator=SuccessfulOrchestrator(),
        static_analysis_service=SuccessfulStaticAnalyzer(),
    )

    await pipeline.run(
        db=db,
        review_id=1,
        files=[
            PipelineFile(
                path="src/App.jsx",
                content="console.log('test');",
            )
        ],
    )

    # ReviewPipeline must not control the transaction.
    db.rollback.assert_not_awaited()


@pytest.mark.asyncio
async def test_static_failure_still_runs_ai_review():
    db = create_fake_db()

    pipeline = ReviewPipeline(
        orchestrator=SuccessfulOrchestrator(),
        static_analysis_service=FailingStaticAnalyzer(),
    )

    result = await pipeline.run(
        db=db,
        review_id=1,
        files=[
            PipelineFile(
                path="src/App.jsx",
                content="console.log('test');",
            )
        ],
    )

    assert result.static_failed is True
    assert result.ai_failed is False

    assert result.files_analyzed == 1
    assert result.files_failed == 0

    # Static analysis failed, but AI findings
    # should still be available.
    assert result.ai_findings == 1
    assert len(result.findings) >= 1


@pytest.mark.asyncio
async def test_ai_failure_still_returns_static_findings():
    db = create_fake_db()

    pipeline = ReviewPipeline(
        orchestrator=FailingOrchestrator(),
        static_analysis_service=SuccessfulStaticAnalyzer(),
    )

    result = await pipeline.run(
        db=db,
        review_id=1,
        files=[
            PipelineFile(
                path="src/App.jsx",
                content="console.log('test');",
            )
        ],
    )

    assert result.ai_failed is True
    assert result.static_failed is False

    assert result.ai_findings == 0
    assert result.static_findings == 1

    # Static findings should still be persisted
    # even when AI is unavailable.
    assert len(result.findings) >= 1

