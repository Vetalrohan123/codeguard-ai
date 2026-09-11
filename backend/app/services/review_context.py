from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class ReviewFileContext:
    """
    Context information for a single file participating
    in a multi-file review.
    """

    path: str
    language: str
    content: str
    imports: tuple[str, ...] = ()
    static_finding_count: int = 0

    @property
    def line_count(self) -> int:
        return len(self.content.splitlines())

    @property
    def character_count(self) -> int:
        return len(self.content)


@dataclass
class ReviewContext:
    """
    Shared context for a multi-file code review.

    Phase 7.4:
    - Stores file metadata.
    - Tracks imports.
    - Tracks static-analysis findings.
    - Identifies related files.
    - Builds bounded project context.

    Phase 7.5 will add file prioritization.
    """

    files: list[ReviewFileContext] = field(
        default_factory=list
    )

    max_files: int = 20

    max_context_characters: int = 60_000

    def add_file(
        self,
        path: str,
        language: str,
        content: str,
        imports: list[str] | None = None,
        static_finding_count: int = 0,
    ) -> None:
        """
        Add a file to the review context.

        Empty paths and empty files are ignored.
        The number of files is bounded by max_files.
        """

        if not path.strip():
            return

        if not content.strip():
            return

        if len(self.files) >= self.max_files:
            return

        normalized_imports = tuple(
            import_path.strip()
            for import_path in (imports or [])
            if import_path
            and import_path.strip()
        )

        self.files.append(
            ReviewFileContext(
                path=path,
                language=language,
                content=content,
                imports=normalized_imports,
                static_finding_count=max(
                    0,
                    static_finding_count,
                ),
            )
        )

    @property
    def total_characters(self) -> int:
        """
        Return the total number of characters
        across all files in the context.
        """

        return sum(
            file.character_count
            for file in self.files
        )

    @property
    def total_lines(self) -> int:
        """
        Return the total number of lines
        across all files in the context.
        """

        return sum(
            file.line_count
            for file in self.files
        )

    def get_file(
        self,
        path: str,
    ) -> ReviewFileContext | None:
        """
        Return the context entry for an exact file path.
        """

        for file in self.files:
            if file.path == path:
                return file

        return None

    def related_files(
        self,
        path: str,
    ) -> list[ReviewFileContext]:
        """
        Return files related to the supplied file.

        A file is considered related when:

        1. The current file imports it.
        2. The other file imports the current file.

        Phase 7.5 will make this relationship analysis
        more sophisticated and prioritize the strongest
        dependencies.
        """

        target = self.get_file(path)

        if target is None:
            return []

        target_imports = set(
            target.imports
        )

        related: list[ReviewFileContext] = []

        for file in self.files:
            if file.path == path:
                continue

            file_imports = set(
                file.imports
            )

            if (
                file.path in target_imports
                or path in file_imports
            ):
                related.append(file)

        return related

    def build_summary(
        self,
        current_file: str | None = None,
    ) -> str:
        """
        Build bounded metadata-only project context.

        Full source code for the current file and related
        files is supplied separately to AIReviewService.
        """

        if not self.files:
            return (
                "No project context is available."
            )

        lines: list[str] = [
            "PROJECT CONTEXT:",
            "",
            "Files participating in this review:",
        ]

        for file in self.files:
            marker = ""

            if file.path == current_file:
                marker = " [CURRENT FILE]"

            lines.append(
                "- "
                f"{file.path}"
                f" | language={file.language}"
                f" | lines={file.line_count}"
                f" | chars={file.character_count}"
                f" | static_findings="
                f"{file.static_finding_count}"
                f"{marker}"
            )

            if file.imports:
                imports = ", ".join(
                    file.imports[:20]
                )

                lines.append(
                    f"  imports: {imports}"
                )

        if current_file:
            related = self.related_files(
                current_file
            )

            if related:
                lines.extend(
                    [
                        "",
                        "RELATED FILES:",
                    ]
                )

                for file in related:
                    lines.append(
                        "- "
                        f"{file.path}"
                        f" | language={file.language}"
                        f" | static_findings="
                        f"{file.static_finding_count}"
                    )

        summary = "\n".join(lines)

        if len(summary) > self.max_context_characters:
            truncation_marker = (
                "\n\n[Context truncated]"
            )

            available_characters = max(
                0,
                self.max_context_characters
                - len(truncation_marker),
            )

            summary = (
                summary[:available_characters].rstrip()
                + truncation_marker
            )

        return summary