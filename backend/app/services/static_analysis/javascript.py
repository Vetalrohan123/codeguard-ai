from __future__ import annotations

import re

from app.services.static_analysis.base import StaticAnalyzer
from app.services.static_analysis.models import StaticFinding


class JavaScriptStaticAnalyzer(StaticAnalyzer):
    """
    Lightweight JavaScript/TypeScript static analyzer.

    Detects common debugging leftovers that should not
    normally be committed to production code.
    """

    name = "javascript-basic"

    SUPPORTED_EXTENSIONS = (
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".mjs",
        ".cjs",
    )

    CONSOLE_PATTERN = re.compile(
        r"\bconsole\.(log|debug|info|warn|error)\s*\("
    )

    DEBUGGER_PATTERN = re.compile(
        r"\bdebugger\s*;"
    )

    async def analyze(
        self,
        file_path: str,
        content: str,
        language: str | None = None,
    ) -> list[StaticFinding]:

        if not file_path.lower().endswith(
            self.SUPPORTED_EXTENSIONS
        ):
            return []

        findings: list[StaticFinding] = []

        for line_number, line in enumerate(
            content.splitlines(),
            start=1,
        ):
            if self.CONSOLE_PATTERN.search(line):
                findings.append(
                    StaticFinding(
                        analyzer=self.name,
                        severity="low",
                        category="quality",
                        title="Debug console logging",
                        description=(
                            "A console statement was detected "
                            "in source code. Debug logging can "
                            "clutter production logs and may "
                            "expose implementation details."
                        ),
                        file=file_path,
                        line=line_number,
                        suggested_fix=(
                            "Remove the debug console statement "
                            "or replace it with the application's "
                            "production logging mechanism."
                        ),
                        confidence=0.98,
                    )
                )

            if self.DEBUGGER_PATTERN.search(line):
                findings.append(
                    StaticFinding(
                        analyzer=self.name,
                        severity="high",
                        category="quality",
                        title="Debugger statement detected",
                        description=(
                            "A debugger statement is present in "
                            "the source code. This can unexpectedly "
                            "pause application execution when "
                            "developer tools are attached."
                        ),
                        file=file_path,
                        line=line_number,
                        suggested_fix=(
                            "Remove the debugger statement before "
                            "merging the code."
                        ),
                        confidence=1.0,
                    )
                )

        return findings