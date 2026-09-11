import pytest

from app.schemas.ai_finding import AIFinding
from app.services.review_orchestrator import ReviewResult
from app.services.review_pipeline import (
    PipelineFile,
    ReviewPipeline,
)
from app.services.static_analysis.models import StaticFinding


class FakeStaticAnalysisService:
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
                suggested_fix="Remove the console.log().",
                confidence=0.98,
            )
        ]


class FakeOrchestrator:
    async def review_files(
        self,
        files,
        static_findings=None,
    ):
        """
        Fake AI orchestrator.

        static_findings is accepted to match the real
        ReviewOrchestrator interface.
        """
        return ReviewResult(
            findings=[
                AIFinding(
                    severity="low",
                    category="quality",
                    title="Leftover debug console logging",
                    description=(
                        "A console.log call remains "
                        "in production code."
                    ),
                    file="src/App.jsx",
                    line=7,
                    why_it_matters=(
                        "Debug logging can expose "
                        "implementation details."
                    ),
                    suggested_fix=(
                        "Remove the console.log call."
                    ),
                    fixed_code="",
                    confidence=0.95,
                )
            ],
            files_analyzed=1,
            files_failed=0,
        )


@pytest.mark.asyncio
async def test_pipeline_deduplicates_static_and_ai_findings():
    pipeline = ReviewPipeline(
        orchestrator=FakeOrchestrator(),
        static_analysis_service=FakeStaticAnalysisService(),
    )

    class FakeDB:
        def __init__(self):
            self.added = []

        def add(self, value):
            self.added.append(value)

        async def flush(self):
            pass

    fake_db = FakeDB()

    result = await pipeline.run(
        db=fake_db,
        review_id=1,
        files=[
            PipelineFile(
                path="src/App.jsx",
                content='console.log("debug");',
            )
        ],
    )

    assert result.static_findings == 1
    assert result.ai_findings == 1

    # The same issue was reported by both
    # ESLint and Gemini.
    assert len(result.findings) == 1

    assert result.findings[0].file == "src/App.jsx"
    assert result.findings[0].line == 7


@pytest.mark.asyncio
async def test_pipeline_keeps_static_finding_when_ai_finding_is_different():
    class DifferentFakeOrchestrator:
        async def review_files(
            self,
            files,
            static_findings=None,
        ):
            return ReviewResult(
                findings=[
                    AIFinding(
                        severity="medium",
                        category="bug",
                        title="Potential runtime issue",
                        description=(
                            "This code may cause an unexpected "
                            "runtime behavior."
                        ),
                        file="src/App.jsx",
                        line=10,
                        why_it_matters=(
                            "Unexpected runtime behavior can "
                            "cause application failures."
                        ),
                        suggested_fix=(
                            "Add appropriate validation."
                        ),
                        fixed_code="",
                        confidence=0.90,
                    )
                ],
                files_analyzed=1,
                files_failed=0,
            )

    pipeline = ReviewPipeline(
        orchestrator=DifferentFakeOrchestrator(),
        static_analysis_service=FakeStaticAnalysisService(),
    )

    class FakeDB:
        def __init__(self):
            self.added = []

        def add(self, value):
            self.added.append(value)

        async def flush(self):
            pass

    fake_db = FakeDB()

    result = await pipeline.run(
        db=fake_db,
        review_id=1,
        files=[
            PipelineFile(
                path="src/App.jsx",
                content=(
                    'console.log("debug");\n'
                    "\n"
                    "\n"
                    "\n"
                    "\n"
                    "\n"
                    "\n"
                    "\n"
                    "\n"
                    "const value = something();"
                ),
            )
        ],
    )

    # Static finding + unrelated AI finding.
    assert result.static_findings == 1
    assert result.ai_findings == 1
    assert len(result.findings) == 2


@pytest.mark.asyncio
async def test_pipeline_preserves_higher_quality_duplicate():
    class RicherFakeOrchestrator:
        async def review_files(
            self,
            files,
            static_findings=None,
        ):
            return ReviewResult(
                findings=[
                    AIFinding(
                        severity="low",
                        category="quality",
                        title="Console logging",
                        description=(
                            "A console.log statement is present "
                            "and should not remain in production."
                        ),
                        file="src/App.jsx",
                        line=7,
                        why_it_matters=(
                            "Production logging can expose internal "
                            "implementation details and create noisy logs."
                        ),
                        suggested_fix=(
                            "Remove the console.log statement or "
                            "replace it with the application's logger."
                        ),
                        fixed_code="",
                        confidence=0.99,
                    )
                ],
                files_analyzed=1,
                files_failed=0,
            )

    pipeline = ReviewPipeline(
        orchestrator=RicherFakeOrchestrator(),
        static_analysis_service=FakeStaticAnalysisService(),
    )

    class FakeDB:
        def __init__(self):
            self.added = []

        def add(self, value):
            self.added.append(value)

        async def flush(self):
            pass

    fake_db = FakeDB()

    result = await pipeline.run(
        db=fake_db,
        review_id=1,
        files=[
            PipelineFile(
                path="src/App.jsx",
                content='console.log("debug");',
            )
        ],
    )

    assert len(result.findings) == 1

    finding = result.findings[0]

    assert finding.file == "src/App.jsx"
    assert finding.line == 7
    assert finding.confidence == 0.99
    assert "console.log" in finding.description


@pytest.mark.asyncio
async def test_pipeline_handles_empty_files():
    pipeline = ReviewPipeline(
        orchestrator=FakeOrchestrator(),
        static_analysis_service=FakeStaticAnalysisService(),
    )

    class FakeDB:
        def __init__(self):
            self.added = []

        def add(self, value):
            self.added.append(value)

        async def flush(self):
            pass

    fake_db = FakeDB()

    result = await pipeline.run(
        db=fake_db,
        review_id=1,
        files=[
            PipelineFile(
                path="src/App.jsx",
                content="   ",
            )
        ],
    )

    assert result.files_analyzed == 0
    assert result.files_failed == 0
    assert result.static_findings == 0
    assert result.ai_findings == 0
    assert len(result.findings) == 0

