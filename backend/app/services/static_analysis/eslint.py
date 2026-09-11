from __future__ import annotations

import asyncio
import json
import os
import shutil
import tempfile
from pathlib import Path
from typing import Any

from app.services.static_analysis.base import StaticAnalyzer
from app.services.static_analysis.models import StaticFinding


class ESLintAnalyzer(StaticAnalyzer):
    """
    Real ESLint-based analyzer for JavaScript and TypeScript.

    Supported extensions:

        .js
        .jsx
        .mjs
        .cjs
        .ts
        .tsx
    """

    name = "eslint"

    SUPPORTED_EXTENSIONS = {
        ".js",
        ".jsx",
        ".mjs",
        ".cjs",
        ".ts",
        ".tsx",
    }

    CATEGORY_RULES = {
        "no-debugger": "quality",
        "no-console": "quality",
        "no-unused-vars": "quality",
        "@typescript-eslint/no-unused-vars": "quality",
        "no-undef": "bug",
        "no-unreachable": "bug",
        "no-constant-condition": "bug",
        "prefer-const": "quality",
        "no-var": "quality",
        "react-hooks/rules-of-hooks": "bug",
        "react-hooks/exhaustive-deps": "bug",
    }

    def __init__(
        self,
        working_directory: str | None = None,
    ) -> None:
        self.working_directory = (
            Path(working_directory)
            if working_directory
            else Path(__file__).resolve().parents[3]
        )

    def supports_file(
        self,
        file_path: str,
    ) -> bool:
        extension = Path(file_path).suffix.lower()

        return extension in self.SUPPORTED_EXTENSIONS

    async def analyze(
        self,
        file_path: str,
        content: str,
        language: str | None = None,
    ) -> list[StaticFinding]:

        if not self.supports_file(file_path):
            return []

        suffix = Path(file_path).suffix.lower()

        temporary_path: Path | None = None

        try:
            temporary_path = self._create_temp_file(
                content=content,
                suffix=suffix,
            )

            diagnostics = await self._run_eslint(
                temporary_path
            )

            return self._convert_diagnostics(
                diagnostics=diagnostics,
                file_path=file_path,
            )

        finally:
            if temporary_path is not None:
                try:
                    temporary_path.unlink(
                        missing_ok=True
                    )
                except OSError:
                    pass

    def _create_temp_file(
        self,
        content: str,
        suffix: str,
    ) -> Path:
        """
        Create a temporary source file inside
        the backend project so ESLint can resolve
        the project's eslint.config.mjs.
        """

        fd, path = tempfile.mkstemp(
            suffix=suffix,
            prefix="codeguard-",
            dir=str(
                self.working_directory
            ),
            text=True,
        )

        try:
            with os.fdopen(
                fd,
                "w",
                encoding="utf-8",
            ) as file:
                file.write(content)

        except Exception:
            try:
                Path(path).unlink(
                    missing_ok=True
                )
            except OSError:
                pass

            raise

        return Path(path)

    @staticmethod
    def _get_npx_command() -> str:
        """
        Return the correct npx executable for
        the current operating system.

        Windows normally requires npx.cmd.
        """

        if os.name == "nt":
            npx = shutil.which("npx.cmd")

            if npx:
                return npx

            # Standard Node.js installation path
            return "npx.cmd"

        npx = shutil.which("npx")

        if npx:
            return npx

        return "npx"

    async def _run_eslint(
        self,
        file_path: Path,
    ) -> list[dict[str, Any]]:

        npx_command = self._get_npx_command()

        command = [
            npx_command,
            "--yes",
            "eslint",
            "--format",
            "json",
            "--no-error-on-unmatched-pattern",
            str(file_path),
        ]

        process = await asyncio.create_subprocess_exec(
            *command,
            cwd=str(
                self.working_directory
            ),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        stdout, stderr = await process.communicate()

        stdout_text = stdout.decode(
            "utf-8",
            errors="replace",
        ).strip()

        stderr_text = stderr.decode(
            "utf-8",
            errors="replace",
        ).strip()

        # ESLint:
        #
        # 0 = no problems
        # 1 = lint problems found
        #
        if process.returncode not in {
            0,
            1,
        }:
            raise RuntimeError(
                "ESLint execution failed "
                f"with exit code "
                f"{process.returncode}."
                f"\n{stderr_text}"
            )

        if not stdout_text:
            return []

        try:
            result = json.loads(
                stdout_text
            )

        except json.JSONDecodeError as error:
            raise RuntimeError(
                "ESLint returned invalid JSON."
                f"\nstdout={stdout_text}"
                f"\nstderr={stderr_text}"
            ) from error

        if not isinstance(
            result,
            list,
        ):
            raise RuntimeError(
                "ESLint returned an unexpected "
                "JSON response."
            )

        return [
            item
            for item in result
            if isinstance(
                item,
                dict,
            )
        ]

    def _convert_diagnostics(
        self,
        diagnostics: list[dict[str, Any]],
        file_path: str,
    ) -> list[StaticFinding]:

        findings: list[StaticFinding] = []

        for result in diagnostics:
            messages = result.get(
                "messages",
                [],
            )

            if not isinstance(
                messages,
                list,
            ):
                continue

            for message in messages:
                if not isinstance(
                    message,
                    dict,
                ):
                    continue

                rule_id = message.get(
                    "ruleId"
                )

                severity_number = message.get(
                    "severity",
                    1,
                )

                line = message.get(
                    "line",
                    1,
                )

                column = message.get(
                    "column",
                    1,
                )

                message_text = message.get(
                    "message",
                    "ESLint detected an issue.",
                )

                if not isinstance(
                    line,
                    int,
                ):
                    line = 1

                if not isinstance(
                    column,
                    int,
                ):
                    column = 1

                if not isinstance(
                    message_text,
                    str,
                ):
                    message_text = str(
                        message_text
                    )

                severity = self._map_severity(
                    severity_number
                )

                category = self._map_category(
                    rule_id
                )

                title = self._build_title(
                    rule_id=rule_id,
                    message=message_text,
                )

                suggested_fix = (
                    self._extract_suggestion(
                        message
                    )
                )

                findings.append(
                    StaticFinding(
                        analyzer=self.name,
                        severity=severity,
                        category=category,
                        title=title,
                        description=(
                            f"ESLint reported: "
                            f"{message_text}"
                        ),
                        file=file_path,
                        line=max(
                            1,
                            line,
                        ),
                        suggested_fix=(
                            suggested_fix
                        ),
                        confidence=0.98,
                    )
                )

        return findings

    @staticmethod
    def _map_severity(
        severity_number: Any,
    ) -> str:

        if severity_number == 2:
            return "high"

        if severity_number == 1:
            return "low"

        return "low"

    def _map_category(
        self,
        rule_id: str | None,
    ) -> str:

        if not rule_id:
            return "quality"

        return self.CATEGORY_RULES.get(
            rule_id,
            "quality",
        )

    @staticmethod
    def _build_title(
        rule_id: str | None,
        message: str,
    ) -> str:

        if rule_id:
            return (
                f"ESLint: {rule_id}"
            )

        return (
            f"ESLint: {message}"
        )

    @staticmethod
    def _extract_suggestion(
        message: dict[str, Any],
    ) -> str | None:

        suggestions = message.get(
            "suggestions"
        )

        if not isinstance(
            suggestions,
            list,
        ):
            return None

        if not suggestions:
            return None

        first = suggestions[0]

        if not isinstance(
            first,
            dict,
        ):
            return None

        description = first.get(
            "desc"
        )

        if (
            isinstance(
                description,
                str,
            )
            and description.strip()
        ):
            return description.strip()

        return None