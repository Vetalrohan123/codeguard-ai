from __future__ import annotations

from app.services.static_analysis.base import StaticAnalyzer
from app.services.static_analysis.eslint import (
    ESLintAnalyzer,
)
from app.services.static_analysis.models import StaticFinding
from app.services.static_analysis.ruff_bandit import (
    RuffBanditAnalyzer,
)


class StaticAnalysisService:
    """
    Coordinates CodeGuard static analyzers.

    JavaScript / TypeScript:
        ESLint

    Python:
        Ruff + Bandit
    """

    def __init__(
        self,
        analyzers: list[StaticAnalyzer] | None = None,
    ) -> None:

        self.analyzers = (
            analyzers
            if analyzers is not None
            else [
                ESLintAnalyzer(),
                RuffBanditAnalyzer(),
            ]
        )

    async def analyze_file(
        self,
        file_path: str,
        content: str,
        language: str | None = None,
    ) -> list[StaticFinding]:

        findings: list[StaticFinding] = []

        for analyzer in self.analyzers:
            try:
                analyzer_findings = (
                    await analyzer.analyze(
                        file_path=file_path,
                        content=content,
                        language=language,
                    )
                )

                findings.extend(
                    analyzer_findings
                )

            except Exception:
                # A failure in one static analyzer
                # should never break the complete
                # CodeGuard review.
                continue

        return findings

    async def analyze_files(
        self,
        files: list[
            tuple[str, str, str | None]
        ],
    ) -> list[StaticFinding]:

        findings: list[StaticFinding] = []

        for (
            file_path,
            content,
            language,
        ) in files:

            file_findings = (
                await self.analyze_file(
                    file_path=file_path,
                    content=content,
                    language=language,
                )
            )

            findings.extend(
                file_findings
            )

        return findings