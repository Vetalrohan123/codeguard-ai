from __future__ import annotations

import asyncio
import json
import tempfile
from pathlib import Path
from typing import Any

from app.services.static_analysis.base import StaticAnalyzer
from app.services.static_analysis.models import StaticFinding


class RuffBanditAnalyzer(StaticAnalyzer):
    """
    Real Python static/security analyzer using:

        Ruff   -> code quality / correctness
        Bandit -> security analysis
    """

    name = "ruff-bandit"

    SUPPORTED_EXTENSIONS = {
        ".py",
    }

    RUFF_RULE_CATEGORIES = {
        "E": "quality",
        "F": "bug",
        "W": "style",
        "I": "style",
        "B": "bug",
        "UP": "quality",
        "SIM": "quality",
        "N": "style",
    }

    BANDIT_SECURITY_RULES = {
        "B102": "security",
        "B103": "security",
        "B104": "security",
        "B105": "security",
        "B106": "security",
        "B107": "security",
        "B108": "security",
        "B301": "security",
        "B302": "security",
        "B307": "security",
        "B311": "security",
        "B324": "security",
        "B602": "security",
        "B603": "security",
        "B604": "security",
        "B605": "security",
        "B606": "security",
        "B607": "security",
        "B608": "security",
        "B609": "security",
    }

    def supports_file(
        self,
        file_path: str,
    ) -> bool:
        return (
            Path(file_path).suffix.lower()
            in self.SUPPORTED_EXTENSIONS
        )

    async def analyze(
        self,
        file_path: str,
        content: str,
        language: str | None = None,
    ) -> list[StaticFinding]:

        if not self.supports_file(file_path):
            return []

        temporary_path: Path | None = None

        try:
            temporary_path = self._create_temp_file(
                content
            )

            ruff_findings = await self._run_ruff(
                temporary_path,
                file_path,
            )

            bandit_findings = await self._run_bandit(
                temporary_path,
                file_path,
            )

            return [
                *ruff_findings,
                *bandit_findings,
            ]

        finally:
            if temporary_path is not None:
                try:
                    temporary_path.unlink(
                        missing_ok=True
                    )
                except OSError:
                    pass

    @staticmethod
    def _create_temp_file(
        content: str,
    ) -> Path:

        temp_file = tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".py",
            prefix="codeguard-",
            encoding="utf-8",
            delete=False,
        )

        try:
            temp_file.write(content)
            temp_file.flush()
        finally:
            temp_file.close()

        return Path(temp_file.name)

    async def _run_ruff(
        self,
        file_path: Path,
        original_file_path: str,
    ) -> list[StaticFinding]:

        command = [
            "py",
            "-3.14",
            "-m",
            "ruff",
            "check",
            "--output-format",
            "json",
            str(file_path),
        ]

        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        stdout, stderr = (
            await process.communicate()
        )

        stdout_text = stdout.decode(
            "utf-8",
            errors="replace",
        ).strip()

        stderr_text = stderr.decode(
            "utf-8",
            errors="replace",
        ).strip()

        # Ruff returns:
        #
        # 0 -> no diagnostics
        # 1 -> diagnostics found
        #
        if process.returncode not in {
            0,
            1,
        }:
            raise RuntimeError(
                "Ruff execution failed: "
                f"{stderr_text}"
            )

        if not stdout_text:
            return []

        try:
            diagnostics = json.loads(
                stdout_text
            )
        except json.JSONDecodeError as error:
            raise RuntimeError(
                "Ruff returned invalid JSON."
            ) from error

        if not isinstance(
            diagnostics,
            list,
        ):
            return []

        findings: list[StaticFinding] = []

        for diagnostic in diagnostics:
            if not isinstance(
                diagnostic,
                dict,
            ):
                continue

            code = diagnostic.get(
                "code"
            )

            message = diagnostic.get(
                "message",
                "Ruff detected an issue.",
            )

            location = diagnostic.get(
                "location"
            ) or {}

            line = location.get(
                "row",
                1,
            )

            if not isinstance(
                line,
                int,
            ):
                line = 1

            category = self._ruff_category(
                code
            )

            severity = self._ruff_severity(
                code
            )

            title = (
                f"Ruff: {code}"
                if code
                else "Ruff diagnostic"
            )

            findings.append(
                StaticFinding(
                    analyzer="ruff",
                    severity=severity,
                    category=category,
                    title=title,
                    description=(
                        f"Ruff reported: "
                        f"{message}"
                    ),
                    file=original_file_path,
                    line=max(1, line),
                    suggested_fix=(
                        "Review the Ruff diagnostic "
                        "and apply the recommended "
                        "code-quality correction."
                    ),
                    confidence=0.97,
                )
            )

        return findings

    async def _run_bandit(
        self,
        file_path: Path,
        original_file_path: str,
    ) -> list[StaticFinding]:

        command = [
            "py",
            "-3.14",
            "-m",
            "bandit",
            "-f",
            "json",
            "-q",
            str(file_path),
        ]

        process = await asyncio.create_subprocess_exec(
            *command,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        stdout, stderr = (
            await process.communicate()
        )

        stdout_text = stdout.decode(
            "utf-8",
            errors="replace",
        ).strip()

        stderr_text = stderr.decode(
            "utf-8",
            errors="replace",
        ).strip()

        # Bandit normally returns:
        #
        # 0 -> no issues
        # 1 -> issues found
        #
        if process.returncode not in {
            0,
            1,
        }:
            # Bandit can sometimes return non-zero
            # for informational conditions. If JSON
            # exists, try to process it anyway.
            if not stdout_text:
                raise RuntimeError(
                    "Bandit execution failed: "
                    f"{stderr_text}"
                )

        if not stdout_text:
            return []

        try:
            data = json.loads(
                stdout_text
            )
        except json.JSONDecodeError as error:
            raise RuntimeError(
                "Bandit returned invalid JSON."
            ) from error

        results = data.get(
            "results",
            [],
        )

        if not isinstance(
            results,
            list,
        ):
            return []

        findings: list[StaticFinding] = []

        for result in results:
            if not isinstance(
                result,
                dict,
            ):
                continue

            test_id = result.get(
                "test_id"
            )

            issue_text = result.get(
                "issue_text",
                "Bandit detected a security issue.",
            )

            line = result.get(
                "line_number",
                1,
            )

            if not isinstance(
                line,
                int,
            ):
                line = 1

            severity = self._bandit_severity(
                result.get("issue_severity")
            )

            confidence = (
                self._bandit_confidence(
                    result.get(
                        "issue_confidence"
                    )
                )
            )

            title = (
                f"Bandit: {test_id}"
                if test_id
                else "Bandit security finding"
            )

            findings.append(
                StaticFinding(
                    analyzer="bandit",
                    severity=severity,
                    category="security",
                    title=title,
                    description=(
                        f"Bandit reported: "
                        f"{issue_text}"
                    ),
                    file=original_file_path,
                    line=max(1, line),
                    suggested_fix=(
                        "Review the Bandit security "
                        "diagnostic and remove or "
                        "secure the vulnerable code."
                    ),
                    confidence=confidence,
                )
            )

        return findings

    @classmethod
    def _ruff_category(
        cls,
        code: str | None,
    ) -> str:

        if not code:
            return "quality"

        for prefix, category in (
            cls.RUFF_RULE_CATEGORIES.items()
        ):
            if code.startswith(prefix):
                return category

        return "quality"

    @staticmethod
    def _ruff_severity(
        code: str | None,
    ) -> str:

        if not code:
            return "low"

        # F-series contains correctness
        # and undefined-name diagnostics.
        if code.startswith("F"):
            return "medium"

        # Security-style Ruff plugins/rules.
        if code.startswith("S"):
            return "high"

        # Syntax errors and major issues.
        if code.startswith("E9"):
            return "high"

        return "low"

    @staticmethod
    def _bandit_severity(
        severity: Any,
    ) -> str:

        normalized = str(
            severity or ""
        ).strip().lower()

        if normalized == "high":
            return "high"

        if normalized == "medium":
            return "medium"

        return "low"

    @staticmethod
    def _bandit_confidence(
        confidence: Any,
    ) -> float:

        normalized = str(
            confidence or ""
        ).strip().lower()

        if normalized == "high":
            return 0.98

        if normalized == "medium":
            return 0.90

        if normalized == "low":
            return 0.75

        return 0.90