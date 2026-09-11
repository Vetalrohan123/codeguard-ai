from __future__ import annotations

from dataclasses import dataclass, field

from app.services.context_prioritizer import (
    FilePriority,
    PriorityTier,
)
from app.services.review_context import (
    ReviewFileContext,
)
from app.services.token_budget import (
    TokenEstimator,
)


@dataclass(frozen=True)
class ContextBudget:
    """
    Maximum context allowed for one AI review request.
    """

    max_total_characters: int = 60_000
    max_current_file_characters: int = 40_000
    max_related_file_characters: int = 8_000
    max_related_files: int = 5
    max_total_tokens: int = 15_000


@dataclass(frozen=True)
class BudgetedFile:
    """
    File content selected for an AI review request.

    The imports are preserved from ReviewFileContext so that
    downstream review orchestration retains dependency metadata.
    """

    path: str
    language: str
    content: str
    imports: list[str] = field(default_factory=list)
    static_finding_count: int = 0
    truncated: bool = False
    original_characters: int = 0
    estimated_tokens: int = 0

    @property
    def character_count(self) -> int:
        return len(self.content)


@dataclass(frozen=True)
class BudgetResult:
    """
    Result of applying a context budget.
    """

    current_file: BudgetedFile
    related_files: list[BudgetedFile]
    total_characters: int
    total_estimated_tokens: int
    dropped_files: list[str]


class ContextBudgetManager:
    """
    Controls how much source code is sent to the AI provider.

    Both character and token budgets are enforced.

    Related files are ranked by dependency relevance before
    the budgets are applied.
    """

    def __init__(
        self,
        budget: ContextBudget | None = None,
        token_estimator: TokenEstimator | None = None,
    ) -> None:
        self.budget = budget or ContextBudget()
        self.token_estimator = (
            token_estimator or TokenEstimator()
        )

    def build(
        self,
        current_file: ReviewFileContext,
        related_files: list[ReviewFileContext],
        priority: FilePriority,
    ) -> BudgetResult:
        """
        Build a budgeted context for one AI review.
        """

        current = self._build_current_file(
            current_file=current_file,
        )

        # Enforce total token budget against the current file.
        if (
            current.estimated_tokens
            > self.budget.max_total_tokens
        ):
            current = self._fit_current_file_to_token_budget(
                current_file=current_file,
            )

        remaining_characters = max(
            0,
            self.budget.max_total_characters
            - current.character_count,
        )

        remaining_tokens = max(
            0,
            self.budget.max_total_tokens
            - current.estimated_tokens,
        )

        max_related_files = (
            self._max_related_files_for_priority(
                priority=priority,
            )
        )

        ranked_related = self._rank_related_files(
            current_file=current_file,
            related_files=related_files,
        )

        selected_related = ranked_related[
            :max_related_files
        ]

        budgeted_related: list[BudgetedFile] = []
        dropped_files: list[str] = []

        for related_file in selected_related:
            if remaining_characters <= 0:
                dropped_files.append(
                    related_file.path
                )
                continue

            if remaining_tokens <= 0:
                dropped_files.append(
                    related_file.path
                )
                continue

            allowed_characters = min(
                self.budget.max_related_file_characters,
                remaining_characters,
                self._characters_for_token_budget(
                    remaining_tokens=remaining_tokens,
                ),
            )

            if allowed_characters <= 0:
                dropped_files.append(
                    related_file.path
                )
                continue

            budgeted = self._build_related_file(
                file=related_file,
                max_characters=allowed_characters,
            )

            if budgeted.character_count == 0:
                dropped_files.append(
                    related_file.path
                )
                continue

            if (
                budgeted.estimated_tokens
                > remaining_tokens
            ):
                budgeted = self._fit_file_to_token_budget(
                    related_file=related_file,
                    max_characters=allowed_characters,
                    max_tokens=remaining_tokens,
                )

            if budgeted.character_count == 0:
                dropped_files.append(
                    related_file.path
                )
                continue

            budgeted_related.append(budgeted)

            remaining_characters -= (
                budgeted.character_count
            )

            remaining_tokens -= (
                budgeted.estimated_tokens
            )

        selected_paths = {
            file.path
            for file in selected_related
        }

        for related_file in ranked_related:
            if related_file.path not in selected_paths:
                dropped_files.append(
                    related_file.path
                )

        total_characters = (
            current.character_count
            + sum(
                file.character_count
                for file in budgeted_related
            )
        )

        total_estimated_tokens = (
            current.estimated_tokens
            + sum(
                file.estimated_tokens
                for file in budgeted_related
            )
        )

        # Final defensive guarantees.
        total_characters = min(
            total_characters,
            self.budget.max_total_characters,
        )

        total_estimated_tokens = min(
            total_estimated_tokens,
            self.budget.max_total_tokens,
        )

        return BudgetResult(
            current_file=current,
            related_files=budgeted_related,
            total_characters=total_characters,
            total_estimated_tokens=(
                total_estimated_tokens
            ),
            dropped_files=dropped_files,
        )

    def _rank_related_files(
        self,
        current_file: ReviewFileContext,
        related_files: list[ReviewFileContext],
    ) -> list[ReviewFileContext]:
        """
        Rank related files by dependency relevance.

        Priority:

        1. Mutual import relationship.
        2. Files directly imported by current file.
        3. Files importing current file.
        4. Remaining related files.

        Original order is used as a stable tie-breaker.
        """

        current_imports = {
            self._normalize_import_path(import_path)
            for import_path in current_file.imports
        }

        normalized_current_path = (
            self._normalize_import_path(
                current_file.path
            )
        )

        ranked: list[
            tuple[int, int, ReviewFileContext]
        ] = []

        for index, file in enumerate(
            related_files
        ):
            normalized_path = (
                self._normalize_import_path(
                    file.path
                )
            )

            normalized_imports = {
                self._normalize_import_path(import_path)
                for import_path in file.imports
            }

            direct_import = self._matches_import(
                normalized_path,
                current_imports,
            )

            imported_by_current = self._matches_import(
                normalized_current_path,
                normalized_imports,
            )

            if (
                direct_import
                and imported_by_current
            ):
                relevance = 4
            elif direct_import:
                relevance = 3
            elif imported_by_current:
                relevance = 2
            else:
                relevance = 1

            ranked.append(
                (
                    -relevance,
                    index,
                    file,
                )
            )

        ranked.sort(
            key=lambda item: (
                item[0],
                item[1],
            )
        )

        return [
            item[2]
            for item in ranked
        ]

    @staticmethod
    def _normalize_import_path(
        path: str,
    ) -> str:
        """
        Normalize common import path differences.
        """

        normalized = (
            path.strip()
            .replace("\\", "/")
        )

        while normalized.startswith("./"):
            normalized = normalized[2:]

        while normalized.startswith("../"):
            normalized = normalized[3:]

        extensions = (
            ".python",
            ".py",
            ".javascript",
            ".js",
            ".typescript",
            ".ts",
            ".tsx",
            ".jsx",
        )

        for extension in extensions:
            if normalized.endswith(extension):
                normalized = normalized[
                    :-len(extension)
                ]
                break

        return normalized.strip("/").lower()

    @classmethod
    def _matches_import(
        cls,
        path: str,
        imports: set[str],
    ) -> bool:
        """
        Determine whether a file path corresponds
        to an import.
        """

        normalized_path = (
            cls._normalize_import_path(path)
        )

        for import_path in imports:
            if normalized_path == import_path:
                return True

            if normalized_path.endswith(
                f"/{import_path}"
            ):
                return True

            if import_path.endswith(
                f"/{normalized_path}"
            ):
                return True

        return False

    def _build_current_file(
        self,
        current_file: ReviewFileContext,
    ) -> BudgetedFile:
        """
        Build the current-file budget.

        The current file receives the largest allocation,
        subject to both character and token limits.
        """

        max_characters = (
            self.budget.max_current_file_characters
        )

        if len(current_file.content) <= max_characters:
            content = current_file.content
            truncated = False
        else:
            content = current_file.content[
                :max_characters
            ]
            truncated = True

        estimated_tokens = (
            self.token_estimator.estimate_tokens(
                content
            )
        )

        return BudgetedFile(
            path=current_file.path,
            language=current_file.language,
            content=content,
            imports=list(current_file.imports),
            truncated=truncated,
            original_characters=len(
                current_file.content
            ),
            estimated_tokens=estimated_tokens,
        )

    def _fit_current_file_to_token_budget(
        self,
        current_file: ReviewFileContext,
    ) -> BudgetedFile:
        """
        Truncate the current file so it fits inside
        the remaining total token budget.
        """

        max_tokens = self.budget.max_total_tokens

        if max_tokens <= 0:
            return BudgetedFile(
                path=current_file.path,
                language=current_file.language,
                content="",
                imports=list(current_file.imports),
                truncated=True,
                original_characters=len(
                    current_file.content
                ),
                estimated_tokens=0,
            )

        max_characters = min(
            self.budget.max_current_file_characters,
            self._characters_for_token_budget(
                remaining_tokens=max_tokens,
            ),
        )

        if max_characters <= 0:
            return BudgetedFile(
                path=current_file.path,
                language=current_file.language,
                content="",
                imports=list(current_file.imports),
                truncated=True,
                original_characters=len(
                    current_file.content
                ),
                estimated_tokens=0,
            )

        content = current_file.content[
            :max_characters
        ]

        while (
            content
            and self.token_estimator.estimate_tokens(
                content
            )
            > max_tokens
        ):
            max_characters -= 1
            content = current_file.content[
                :max_characters
            ]

        if not content:
            return BudgetedFile(
                path=current_file.path,
                language=current_file.language,
                content="",
                imports=list(current_file.imports),
                truncated=True,
                original_characters=len(
                    current_file.content
                ),
                estimated_tokens=0,
            )

        estimated_tokens = (
            self.token_estimator.estimate_tokens(
                content
            )
        )

        return BudgetedFile(
            path=current_file.path,
            language=current_file.language,
            content=content,
            imports=list(current_file.imports),
            truncated=(
                len(content)
                < len(current_file.content)
            ),
            original_characters=len(
                current_file.content
            ),
            estimated_tokens=estimated_tokens,
        )

    def _build_related_file(
        self,
        file: ReviewFileContext,
        max_characters: int,
    ) -> BudgetedFile:
        """
        Truncate related-file source when necessary.
        """

        original_characters = len(
            file.content
        )

        if original_characters <= max_characters:
            content = file.content
            truncated = False
        else:
            content = file.content[
                :max_characters
            ]
            truncated = True

        estimated_tokens = (
            self.token_estimator.estimate_tokens(
                content
            )
        )

        return BudgetedFile(
            path=file.path,
            language=file.language,
            content=content,
            imports=list(file.imports),
            truncated=truncated,
            original_characters=(
                original_characters
            ),
            estimated_tokens=estimated_tokens,
        )

    def _fit_file_to_token_budget(
        self,
        related_file: ReviewFileContext,
        max_characters: int,
        max_tokens: int,
    ) -> BudgetedFile:
        """
        Fit a related file inside the remaining
        token budget.
        """

        if max_tokens <= 0:
            return BudgetedFile(
                path=related_file.path,
                language=related_file.language,
                content="",
                imports=list(related_file.imports),
                truncated=True,
                original_characters=len(
                    related_file.content
                ),
                estimated_tokens=0,
            )

        estimated_character_limit = int(
            max_tokens
            * self.token_estimator.chars_per_token
        )

        allowed_characters = min(
            max_characters,
            estimated_character_limit,
        )

        if allowed_characters <= 0:
            return BudgetedFile(
                path=related_file.path,
                language=related_file.language,
                content="",
                imports=list(related_file.imports),
                truncated=True,
                original_characters=len(
                    related_file.content
                ),
                estimated_tokens=0,
            )

        content = related_file.content[
            :allowed_characters
        ]

        while (
            content
            and self.token_estimator.estimate_tokens(
                content
            )
            > max_tokens
        ):
            allowed_characters -= 1
            content = related_file.content[
                :allowed_characters
            ]

        if not content:
            return BudgetedFile(
                path=related_file.path,
                language=related_file.language,
                content="",
                imports=list(related_file.imports),
                truncated=True,
                original_characters=len(
                    related_file.content
                ),
                estimated_tokens=0,
            )

        return BudgetedFile(
            path=related_file.path,
            language=related_file.language,
            content=content,
            imports=list(related_file.imports),
            truncated=(
                len(content)
                < len(related_file.content)
            ),
            original_characters=len(
                related_file.content
            ),
            estimated_tokens=(
                self.token_estimator.estimate_tokens(
                    content
                )
            ),
        )

    def _characters_for_token_budget(
        self,
        remaining_tokens: int,
    ) -> int:
        """
        Convert remaining tokens into an approximate
        character budget.
        """

        return max(
            0,
            int(
                remaining_tokens
                * self.token_estimator.chars_per_token
            ),
        )

    def _max_related_files_for_priority(
        self,
        priority: FilePriority,
    ) -> int:
        """
        Allocate related-file slots based on priority.
        """

        if priority.tier == PriorityTier.HIGH:
            return min(
                self.budget.max_related_files,
                5,
            )

        if priority.tier == PriorityTier.MEDIUM:
            return min(
                self.budget.max_related_files,
                3,
            )

        return min(
            self.budget.max_related_files,
            1,
        )