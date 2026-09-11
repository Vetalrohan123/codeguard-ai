from __future__ import annotations

import re
from dataclasses import dataclass

from app.schemas.ai_finding import AIFinding
from app.services.static_analysis.models import StaticFinding


@dataclass(frozen=True)
class FindingFingerprint:
    """
    Stable identity used to determine whether findings from
    different analyzers represent the same underlying issue.
    """

    file: str
    line: int
    category: str
    issue: str


class FindingAggregator:
    """
    Normalizes and merges findings produced by:

        - Gemini
        - ESLint
        - Ruff
        - Bandit

    The goal is to prevent the same underlying problem from
    appearing multiple times in the final review.

    Findings are prioritized by:

        1. Severity
        2. Confidence
        3. Explanation/fix richness
    """

    # ------------------------------------------------------------------
    # Severity
    # ------------------------------------------------------------------

    SEVERITY_RANK = {
        "critical": 4,
        "high": 3,
        "medium": 2,
        "low": 1,
    }

    @classmethod
    def _severity_rank(cls, severity: str) -> int:
        """
        Return a numeric ranking for a severity.

        Higher number = more severe.
        """

        return cls.SEVERITY_RANK.get(
            severity.strip().lower(),
            0,
        )

    # ------------------------------------------------------------------
    # Static -> AI schema conversion
    # ------------------------------------------------------------------

    @staticmethod
    def static_to_ai(
        finding: StaticFinding,
    ) -> AIFinding:
        """
        Convert a deterministic static-analysis finding into
        the common AIFinding schema.
        """

        return AIFinding(
            severity=finding.severity,
            category=FindingAggregator.normalize_category(
                finding.category
            ),
            title=finding.title,
            description=finding.description,
            file=finding.file,
            line=max(1, finding.line),
            why_it_matters=finding.description,
            suggested_fix=(
                finding.suggested_fix
                or "Review and correct this issue."
            ),
            fixed_code="",
            confidence=finding.confidence,
        )

    # ------------------------------------------------------------------
    # Category normalization
    # ------------------------------------------------------------------

    @staticmethod
    def normalize_category(category: str) -> str:
        normalized = category.strip().lower()

        mapping = {
            "bug": "bug",
            "bugs": "bug",

            "security": "security",
            "vulnerability": "security",
            "vulnerabilities": "security",

            "performance": "performance",

            "quality": "quality",
            "code-quality": "quality",

            "style": "style",
            "formatting": "style",

            "maintainability": "quality",
            "reliability": "bug",
        }

        return mapping.get(
            normalized,
            "quality",
        )

    # ------------------------------------------------------------------
    # AI severity calibration
    # ------------------------------------------------------------------

    @classmethod
    def calibrate_severity(
        cls,
        finding: AIFinding,
        source: str,
    ) -> AIFinding:
        """
        Calibrate AI-generated severity.

        Static analyzer findings are deterministic evidence and
        therefore remain unchanged.

        AI rules:

            critical + confidence < 0.85 -> high
            high + confidence < 0.65     -> medium

        Otherwise severity remains unchanged.
        """

        normalized_source = source.strip().lower()

        # Static analyzer findings are authoritative.
        if normalized_source == "static":
            return finding

        severity = finding.severity.strip().lower()
        confidence = finding.confidence or 0.0

        if severity == "critical" and confidence < 0.85:
            severity = "high"

        elif severity == "high" and confidence < 0.65:
            severity = "medium"

        return finding.model_copy(
            update={
                "severity": severity,
            }
        )

    # ------------------------------------------------------------------
    # Analyzer/rule normalization
    # ------------------------------------------------------------------

    @staticmethod
    def normalize_issue(
        finding: AIFinding,
    ) -> str:
        """
        Convert analyzer-specific wording into a stable issue key.

        Important:

        The description and suggested fix are intentionally NOT used
        as the generic identity because two analyzers/AI responses can
        explain the same issue differently.

        Known analyzer/rule patterns get dedicated stable identities.

        Unknown issues fall back to the normalized title.
        """

        title = finding.title.strip().lower()

        text = " ".join(
            [
                finding.title,
                finding.description,
                finding.suggested_fix,
                finding.why_it_matters,
            ]
        ).lower()

        normalized_title = title

        # --------------------------------------------------------------
        # JavaScript / TypeScript
        # --------------------------------------------------------------

        if (
            "no-console" in normalized_title
            or "console.log" in text
            or "console.warn" in text
            or "console.error" in text
            or "console.info" in text
            or "console.debug" in text
            or "console statement" in text
            or "debug console" in text
            or "console logging" in text
        ):
            return "console_logging"

        if (
            "no-debugger" in normalized_title
            or "debugger statement" in text
            or "'debugger'" in text
            or '"debugger"' in text
            or "debugger;" in text
        ):
            return "debugger_statement"

        if (
            "no-unused-vars" in normalized_title
            or "unused variable" in text
            or "assigned a value but never used" in text
            or "defined but never used" in text
            or "never used" in text
        ):
            return "unused_variable"

        if (
            "no-undef" in normalized_title
            or "is not defined" in text
            or "undefined variable" in text
        ):
            return "undefined_variable"

        if (
            "no-unreachable" in normalized_title
            or "unreachable code" in text
        ):
            return "unreachable_code"

        if (
            "no-constant-condition" in normalized_title
            or "constant condition" in text
            or "condition is always" in text
        ):
            return "constant_condition"

        if (
            "prefer-const" in normalized_title
            or "prefer const" in text
        ):
            return "prefer_const"

        if (
            "no-var" in normalized_title
            or "var declaration" in text
            or "use let or const" in text
        ):
            return "var_declaration"

        if (
            "react-hooks/rules-of-hooks" in normalized_title
            or "rules of hooks" in text
            or (
                "hook" in text
                and "conditional" in text
            )
        ):
            return "react_hooks_rules"

        if (
            "react-hooks/exhaustive-deps" in normalized_title
            or "missing dependency" in text
            or "dependencies array" in text
        ):
            return "react_hooks_dependencies"

        # --------------------------------------------------------------
        # Python / Security
        # --------------------------------------------------------------

        if (
            "hardcoded password" in text
            or "hardcoded secret" in text
            or "hardcoded api key" in text
            or "hardcoded credential" in text
            or (
                "secret" in text
                and "hardcoded" in text
            )
        ):
            return "hardcoded_secret"

        if (
            "eval(" in text
            or "use of eval" in text
            or "dangerous eval" in text
        ):
            return "dynamic_eval"

        if (
            "exec(" in text
            or "use of exec" in text
            or "dangerous exec" in text
        ):
            return "dynamic_exec"

        if (
            "shell=true" in text
            or "command injection" in text
            or (
                "subprocess" in text
                and "shell" in text
            )
        ):
            return "shell_execution"

        if (
            "sql injection" in text
            or "sql-injection" in text
        ):
            return "sql_injection"

        # --------------------------------------------------------------
        # Generic issue normalization
        # --------------------------------------------------------------

        # The title is used as the stable identity.
        #
        # Example:
        #
        #   Title: "Security issue"
        #   Description A: "A high severity security issue..."
        #   Description B: "A critical security issue..."
        #
        # Both become:
        #
        #   security_issue
        #
        # This allows severity/confidence/richness comparison to work.
        generic = re.sub(
            r"[^a-z0-9]+",
            "_",
            normalized_title,
        )

        generic = re.sub(
            r"_+",
            "_",
            generic,
        ).strip("_")

        if not generic:
            return "unknown_issue"

        return generic[:120]

    # ------------------------------------------------------------------
    # Fingerprint
    # ------------------------------------------------------------------

    @classmethod
    def fingerprint(
        cls,
        finding: AIFinding,
    ) -> FindingFingerprint:
        return FindingFingerprint(
            file=cls.normalize_file(
                finding.file
            ),
            line=max(1, finding.line),
            category=cls.normalize_category(
                finding.category
            ),
            issue=cls.normalize_issue(
                finding
            ),
        )

    # ------------------------------------------------------------------
    # File normalization
    # ------------------------------------------------------------------

    @staticmethod
    def normalize_file(
        file_path: str,
    ) -> str:
        normalized = (
            file_path
            .strip()
            .replace("\\", "/")
        )

        while normalized.startswith("./"):
            normalized = normalized[2:]

        return normalized.lower()

    # ------------------------------------------------------------------
    # Merge
    # ------------------------------------------------------------------

    @classmethod
    def merge(
        cls,
        ai_findings: list[AIFinding],
        static_findings: list[StaticFinding],
    ) -> list[AIFinding]:
        """
        Merge AI + static analyzer findings.

        Static findings are converted into the common AIFinding
        representation before deduplication.
        """

        converted_static = [
            cls.static_to_ai(finding)
            for finding in static_findings
        ]

        combined = [
            *ai_findings,
            *converted_static,
        ]

        return cls.deduplicate(
            combined
        )

    # ------------------------------------------------------------------
    # Deduplication
    # ------------------------------------------------------------------

    @classmethod
    def deduplicate(
        cls,
        findings: list[AIFinding],
    ) -> list[AIFinding]:
        """
        Deduplicate findings.

        Findings are considered duplicates when they have:

            same normalized file
            same category
            same normalized issue
            same line or nearby line

        When duplicates are found, the preferred finding is selected
        using:

            1. Severity
            2. Confidence
            3. Richness
        """

        selected: dict[
            FindingFingerprint,
            AIFinding,
        ] = {}

        for finding in findings:
            fingerprint = cls.fingerprint(
                finding
            )

            # ----------------------------------------------------------
            # Exact fingerprint
            # ----------------------------------------------------------

            existing = selected.get(
                fingerprint
            )

            if existing is not None:
                selected[fingerprint] = (
                    cls._prefer_finding(
                        existing,
                        finding,
                    )
                )
                continue

            # ----------------------------------------------------------
            # Nearby equivalent issue
            # ----------------------------------------------------------

            duplicate_key = (
                cls._find_nearby_duplicate(
                    fingerprint=fingerprint,
                    selected=selected,
                )
            )

            if duplicate_key is not None:
                selected[duplicate_key] = (
                    cls._prefer_finding(
                        selected[duplicate_key],
                        finding,
                    )
                )
                continue

            selected[fingerprint] = finding

        return list(
            selected.values()
        )

    # ------------------------------------------------------------------
    # Nearby duplicate detection
    # ------------------------------------------------------------------

    @staticmethod
    def _find_nearby_duplicate(
        fingerprint: FindingFingerprint,
        selected: dict[
            FindingFingerprint,
            AIFinding,
        ],
    ) -> FindingFingerprint | None:
        """
        Static analyzers and LLMs can report slightly different lines.

        Findings are considered duplicates when the normalized
        file/category/issue match and the line numbers are within
        two lines.
        """

        for existing in selected:
            if existing.file != fingerprint.file:
                continue

            if existing.category != fingerprint.category:
                continue

            if existing.issue != fingerprint.issue:
                continue

            if abs(
                existing.line - fingerprint.line
            ) <= 2:
                return existing

        return None

    # ------------------------------------------------------------------
    # Choosing the best duplicate
    # ------------------------------------------------------------------

    @classmethod
    def _prefer_finding(
        cls,
        first: AIFinding,
        second: AIFinding,
    ) -> AIFinding:
        """
        Select the better duplicate.

        Priority:

            1. Higher severity
            2. Higher confidence
            3. Richer explanation/fix
        """

        first_severity = cls._severity_rank(
            first.severity
        )

        second_severity = cls._severity_rank(
            second.severity
        )

        # --------------------------------------------------------------
        # Severity
        # --------------------------------------------------------------

        if second_severity > first_severity:
            preferred = second

        elif first_severity > second_severity:
            preferred = first

        else:
            # ----------------------------------------------------------
            # Confidence
            # ----------------------------------------------------------

            first_confidence = (
                first.confidence or 0.0
            )

            second_confidence = (
                second.confidence or 0.0
            )

            if second_confidence > first_confidence:
                preferred = second

            elif first_confidence > second_confidence:
                preferred = first

            else:
                # ------------------------------------------------------
                # Richness
                # ------------------------------------------------------

                if (
                    cls._richness_score(second)
                    > cls._richness_score(first)
                ):
                    preferred = second
                else:
                    preferred = first

        return preferred

    # ------------------------------------------------------------------
    # Finding comparison helper
    # ------------------------------------------------------------------

    @classmethod
    def _is_better_finding(
        cls,
        candidate: AIFinding,
        existing: AIFinding,
    ) -> bool:
        """
        Return True when candidate should replace existing.

        Priority:

            1. Severity
            2. Confidence
            3. Richness
        """

        candidate_severity = cls._severity_rank(
            candidate.severity
        )

        existing_severity = cls._severity_rank(
            existing.severity
        )

        if candidate_severity != existing_severity:
            return (
                candidate_severity
                > existing_severity
            )

        candidate_confidence = (
            candidate.confidence or 0.0
        )

        existing_confidence = (
            existing.confidence or 0.0
        )

        if candidate_confidence != existing_confidence:
            return (
                candidate_confidence
                > existing_confidence
            )

        candidate_richness = (
            cls._richness_score(candidate)
        )

        existing_richness = (
            cls._richness_score(existing)
        )

        return (
            candidate_richness
            > existing_richness
        )

    # ------------------------------------------------------------------
    # Richness score
    # ------------------------------------------------------------------

    @staticmethod
    def _richness_score(
        finding: AIFinding,
    ) -> int:
        """
        Calculate how much useful information a finding contains.

        Used only after severity and confidence.
        """

        score = 0

        if finding.description.strip():
            score += min(
                len(finding.description),
                500,
            )

        if finding.why_it_matters.strip():
            score += min(
                len(finding.why_it_matters),
                500,
            )

        if finding.suggested_fix.strip():
            score += min(
                len(finding.suggested_fix),
                500,
            )

        if finding.fixed_code.strip():
            score += min(
                len(finding.fixed_code),
                500,
            )

        return score

    # ------------------------------------------------------------------
    # Sorting
    # ------------------------------------------------------------------

    @classmethod
    def sort(
        cls,
        findings: list[AIFinding],
    ) -> list[AIFinding]:
        """
        Sort findings by:

            1. Severity
            2. Confidence
            3. File
            4. Line
        """

        severity_order = {
            "critical": 0,
            "high": 1,
            "medium": 2,
            "low": 3,
        }

        return sorted(
            findings,
            key=lambda finding: (
                severity_order.get(
                    finding.severity.strip().lower(),
                    99,
                ),
                -(finding.confidence or 0.0),
                cls.normalize_file(
                    finding.file
                ),
                finding.line,
            ),
        )

