from __future__ import annotations

import re

from app.services.static_analysis.base import StaticAnalyzer
from app.services.static_analysis.models import StaticFinding


class PythonStaticAnalyzer(StaticAnalyzer):
    """
    Lightweight Python security and quality analyzer.

    Detects common dangerous patterns such as:
    - eval()
    - exec()
    - subprocess shell execution
    - hard-coded password/token assignments
    - debug print statements
    """

    name = "python-basic"

    SUPPORTED_EXTENSIONS = (
        ".py",
    )

    EVAL_PATTERN = re.compile(
        r"\beval\s*\("
    )

    EXEC_PATTERN = re.compile(
        r"\bexec\s*\("
    )

    SUBPROCESS_SHELL_PATTERN = re.compile(
        r"\bsubprocess\.(run|call|Popen|check_call|check_output)\s*\("
    )

    SHELL_TRUE_PATTERN = re.compile(
        r"\bshell\s*=\s*True\b"
    )

    SECRET_PATTERN = re.compile(
        r"""
        \b
        (
            password |
            passwd |
            secret |
            api[_-]?key |
            access[_-]?token |
            auth[_-]?token
        )
        \b
        \s*=\s*
        ['"][^'"]+['"]
        """,
        re.IGNORECASE | re.VERBOSE,
    )

    PRINT_PATTERN = re.compile(
        r"\bprint\s*\("
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
            stripped = line.strip()

            if not stripped or stripped.startswith("#"):
                continue

            # -------------------------------------------------
            # eval()
            # -------------------------------------------------

            if self.EVAL_PATTERN.search(line):
                findings.append(
                    StaticFinding(
                        analyzer=self.name,
                        severity="critical",
                        category="security",
                        title="Dangerous use of eval()",
                        description=(
                            "eval() executes dynamically supplied "
                            "Python code and can lead to arbitrary "
                            "code execution when the evaluated "
                            "expression contains untrusted input."
                        ),
                        file=file_path,
                        line=line_number,
                        suggested_fix=(
                            "Avoid eval(). Use explicit parsing "
                            "or a safe data format such as JSON."
                        ),
                        confidence=0.99,
                    )
                )

            # -------------------------------------------------
            # exec()
            # -------------------------------------------------

            if self.EXEC_PATTERN.search(line):
                findings.append(
                    StaticFinding(
                        analyzer=self.name,
                        severity="critical",
                        category="security",
                        title="Dangerous use of exec()",
                        description=(
                            "exec() dynamically executes Python "
                            "code and can introduce arbitrary "
                            "code execution vulnerabilities."
                        ),
                        file=file_path,
                        line=line_number,
                        suggested_fix=(
                            "Avoid exec(). Replace dynamic code "
                            "execution with explicit program logic."
                        ),
                        confidence=0.99,
                    )
                )

            # -------------------------------------------------
            # subprocess
            # -------------------------------------------------

            if self.SUBPROCESS_SHELL_PATTERN.search(line):
                findings.append(
                    StaticFinding(
                        analyzer=self.name,
                        severity="medium",
                        category="security",
                        title="Subprocess execution detected",
                        description=(
                            "The code launches a system process. "
                            "If command arguments originate from "
                            "untrusted input, this can become a "
                            "command injection vulnerability."
                        ),
                        file=file_path,
                        line=line_number,
                        suggested_fix=(
                            "Validate command arguments and avoid "
                            "shell execution with untrusted input. "
                            "Prefer passing arguments as a list."
                        ),
                        confidence=0.90,
                    )
                )

            # -------------------------------------------------
            # shell=True
            # -------------------------------------------------

            if self.SHELL_TRUE_PATTERN.search(line):
                findings.append(
                    StaticFinding(
                        analyzer=self.name,
                        severity="high",
                        category="security",
                        title="subprocess uses shell=True",
                        description=(
                            "shell=True causes the command to be "
                            "interpreted by the system shell. "
                            "Combining this with untrusted input "
                            "can enable command injection."
                        ),
                        file=file_path,
                        line=line_number,
                        suggested_fix=(
                            "Avoid shell=True whenever possible. "
                            "Pass commands and arguments directly "
                            "as a list to subprocess."
                        ),
                        confidence=0.97,
                    )
                )

            # -------------------------------------------------
            # Hard-coded secrets
            # -------------------------------------------------

            if self.SECRET_PATTERN.search(line):
                findings.append(
                    StaticFinding(
                        analyzer=self.name,
                        severity="critical",
                        category="security",
                        title="Possible hard-coded secret",
                        description=(
                            "A password, token, API key, or secret "
                            "appears to be directly assigned in "
                            "source code."
                        ),
                        file=file_path,
                        line=line_number,
                        suggested_fix=(
                            "Move secrets into environment variables "
                            "or a dedicated secret-management system. "
                            "Never commit credentials to source control."
                        ),
                        confidence=0.96,
                    )
                )

            # -------------------------------------------------
            # print()
            # -------------------------------------------------

            if self.PRINT_PATTERN.search(line):
                findings.append(
                    StaticFinding(
                        analyzer=self.name,
                        severity="low",
                        category="quality",
                        title="Debug print statement",
                        description=(
                            "A print() statement was detected. "
                            "Debug output should generally be removed "
                            "or replaced with structured application "
                            "logging before production."
                        ),
                        file=file_path,
                        line=line_number,
                        suggested_fix=(
                            "Remove the debug print statement or "
                            "replace it with the application's "
                            "logging framework."
                        ),
                        confidence=0.94,
                    )
                )

        return findings