from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

from app.services.review_context import (
    ReviewContext,
    ReviewFileContext,
)


class PriorityTier(StrEnum):
    """
    Priority tier assigned to a file during review.
    """

    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


@dataclass(frozen=True)
class FilePriority:
    """
    Priority information for a file participating
    in an AI code review.
    """

    path: str

    score: float

    tier: PriorityTier

    import_score: float

    static_finding_score: float

    size_score: float

    language_score: float

    dependency_score: float

    reason: str


class ContextPrioritizer:
    """
    Calculates the importance of files for AI review.

    Priority is based on:

    - Import relationships
    - Static-analysis findings
    - File size
    - Programming language
    - Dependency centrality
    """

    IMPORT_WEIGHT = 0.25
    STATIC_FINDING_WEIGHT = 0.30
    SIZE_WEIGHT = 0.10
    LANGUAGE_WEIGHT = 0.10
    DEPENDENCY_WEIGHT = 0.25

    HIGH_PRIORITY_THRESHOLD = 70.0
    MEDIUM_PRIORITY_THRESHOLD = 40.0

    HIGH_RISK_LANGUAGES = {
        "python",
        "javascript",
        "typescript",
        "java",
        "c",
        "cpp",
        "c++",
        "go",
        "rust",
    }

    def prioritize(
        self,
        context: ReviewContext,
    ) -> list[FilePriority]:
        """
        Calculate priority for every file.

        Results are sorted from highest priority
        to lowest priority.
        """

        if not context.files:
            return []

        priorities: list[FilePriority] = []

        max_static_findings = max(
            (
                file.static_finding_count
                for file in context.files
            ),
            default=0,
        )

        max_file_size = max(
            (
                file.character_count
                for file in context.files
            ),
            default=0,
        )

        for file in context.files:
            import_score = (
                self._calculate_import_score(
                    file=file,
                    context=context,
                )
            )

            static_finding_score = (
                self._calculate_static_finding_score(
                    file=file,
                    max_static_findings=max_static_findings,
                )
            )

            size_score = (
                self._calculate_size_score(
                    file=file,
                    max_file_size=max_file_size,
                )
            )

            language_score = (
                self._calculate_language_score(file)
            )

            dependency_score = (
                self._calculate_dependency_score(
                    file=file,
                    context=context,
                )
            )

            normalized_score = (
                import_score * self.IMPORT_WEIGHT
                + static_finding_score
                * self.STATIC_FINDING_WEIGHT
                + size_score * self.SIZE_WEIGHT
                + language_score
                * self.LANGUAGE_WEIGHT
                + dependency_score
                * self.DEPENDENCY_WEIGHT
            )

            score = round(
                min(
                    100.0,
                    max(
                        0.0,
                        normalized_score * 100,
                    ),
                ),
                2,
            )

            tier = self._get_priority_tier(score)

            reason = self._build_reason(
                import_score=import_score,
                static_finding_score=static_finding_score,
                size_score=size_score,
                language_score=language_score,
                dependency_score=dependency_score,
            )

            priorities.append(
                FilePriority(
                    path=file.path,
                    score=score,
                    tier=tier,
                    import_score=round(
                        import_score * 100,
                        2,
                    ),
                    static_finding_score=round(
                        static_finding_score * 100,
                        2,
                    ),
                    size_score=round(
                        size_score * 100,
                        2,
                    ),
                    language_score=round(
                        language_score * 100,
                        2,
                    ),
                    dependency_score=round(
                        dependency_score * 100,
                        2,
                    ),
                    reason=reason,
                )
            )

        priorities.sort(
            key=lambda item: (
                -item.score,
                item.path,
            )
        )

        return priorities

    def prioritized_files(
        self,
        context: ReviewContext,
    ) -> list[ReviewFileContext]:
        """
        Return ReviewFileContext objects sorted by priority.
        """

        priorities = self.prioritize(context)

        file_map = {
            file.path: file
            for file in context.files
        }

        return [
            file_map[priority.path]
            for priority in priorities
            if priority.path in file_map
        ]

    def get_priority(
        self,
        context: ReviewContext,
        path: str,
    ) -> FilePriority | None:
        """
        Return priority information for one file.
        """

        priorities = self.prioritize(context)

        for priority in priorities:
            if priority.path == path:
                return priority

        return None

    @classmethod
    def _get_priority_tier(
        cls,
        score: float,
    ) -> PriorityTier:
        """
        Convert numeric priority into a review tier.
        """

        if score >= cls.HIGH_PRIORITY_THRESHOLD:
            return PriorityTier.HIGH

        if score >= cls.MEDIUM_PRIORITY_THRESHOLD:
            return PriorityTier.MEDIUM

        return PriorityTier.LOW

    def _calculate_import_score(
        self,
        file: ReviewFileContext,
        context: ReviewContext,
    ) -> float:
        """
        Score import relationships.

        Files with many direct and reverse import
        relationships receive higher priority.
        """

        if not context.files:
            return 0.0

        direct_imports = len(file.imports)

        imported_by_count = sum(
            1
            for other in context.files
            if other.path != file.path
            and file.path in other.imports
        )

        relationship_count = (
            direct_imports
            + imported_by_count
        )

        max_relationships = max(
            (
                len(other.imports)
                + sum(
                    1
                    for candidate in context.files
                    if candidate.path != other.path
                    and other.path in candidate.imports
                )
                for other in context.files
            ),
            default=0,
        )

        if max_relationships == 0:
            return 0.0

        return min(
            1.0,
            relationship_count
            / max_relationships,
        )

    @staticmethod
    def _calculate_static_finding_score(
        file: ReviewFileContext,
        max_static_findings: int,
    ) -> float:
        """
        Normalize static-analysis findings.
        """

        if max_static_findings <= 0:
            return 0.0

        return min(
            1.0,
            file.static_finding_count
            / max_static_findings,
        )

    @staticmethod
    def _calculate_size_score(
        file: ReviewFileContext,
        max_file_size: int,
    ) -> float:
        """
        Give file size a small influence on priority.
        """

        if max_file_size <= 0:
            return 0.0

        return min(
            1.0,
            file.character_count
            / max_file_size,
        )

    def _calculate_language_score(
        self,
        file: ReviewFileContext,
    ) -> float:
        """
        Give supported/high-risk languages a priority boost.
        """

        language = file.language.strip().lower()

        if language in self.HIGH_RISK_LANGUAGES:
            return 1.0

        return 0.5

    @staticmethod
    def _calculate_dependency_score(
        file: ReviewFileContext,
        context: ReviewContext,
    ) -> float:
        """
        Calculate dependency centrality.

        A file receives a higher score when many other
        files depend on it.
        """

        dependent_count = sum(
            1
            for other in context.files
            if other.path != file.path
            and file.path in other.imports
        )

        max_dependents = max(
            (
                sum(
                    1
                    for other in context.files
                    if other.path != candidate.path
                    and candidate.path in other.imports
                )
                for candidate in context.files
            ),
            default=0,
        )

        if max_dependents <= 0:
            return 0.0

        return min(
            1.0,
            dependent_count
            / max_dependents,
        )

    @staticmethod
    def _build_reason(
        import_score: float,
        static_finding_score: float,
        size_score: float,
        language_score: float,
        dependency_score: float,
    ) -> str:
        """
        Explain the main factors contributing to priority.
        """

        reasons: list[str] = []

        if import_score >= 0.7:
            reasons.append(
                "strong import relationships"
            )

        if static_finding_score >= 0.7:
            reasons.append(
                "many static findings"
            )

        if size_score >= 0.7:
            reasons.append(
                "large file"
            )

        if language_score >= 0.9:
            reasons.append(
                "strongly supported language"
            )

        if dependency_score >= 0.7:
            reasons.append(
                "high dependency centrality"
            )

        if not reasons:
            reasons.append(
                "normal review priority"
            )

        return ", ".join(reasons)