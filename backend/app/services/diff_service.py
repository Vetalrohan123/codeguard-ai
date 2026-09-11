from dataclasses import dataclass
from pathlib import Path


@dataclass
class DiffFile:
    filename: str
    status: str
    additions: int
    deletions: int
    changes: int
    patch: str | None
    sha: str | None

    @property
    def extension(self) -> str:
        return Path(self.filename).suffix.lower()

    @property
    def language(self) -> str:
        extension_map = {
            ".py": "python",
            ".js": "javascript",
            ".jsx": "javascript",
            ".ts": "typescript",
            ".tsx": "typescript",
            ".java": "java",
            ".c": "c",
            ".h": "c",
            ".cpp": "cpp",
            ".cc": "cpp",
            ".cxx": "cpp",
            ".cs": "csharp",
            ".go": "go",
            ".rs": "rust",
            ".php": "php",
            ".rb": "ruby",
            ".swift": "swift",
            ".kt": "kotlin",
            ".kts": "kotlin",
            ".scala": "scala",
            ".sql": "sql",
            ".sh": "shell",
            ".bash": "shell",
            ".html": "html",
            ".css": "css",
            ".scss": "scss",
            ".json": "json",
            ".yaml": "yaml",
            ".yml": "yaml",
            ".xml": "xml",
            ".md": "markdown",
        }

        return extension_map.get(
            self.extension,
            "unknown",
        )


class DiffService:

    @staticmethod
    def from_github_file(
        github_file: dict,
    ) -> DiffFile:
        """
        Convert a GitHub API file object into our
        normalized DiffFile representation.
        """

        return DiffFile(
            filename=github_file.get(
                "filename",
                "",
            ),
            status=github_file.get(
                "status",
                "modified",
            ),
            additions=int(
                github_file.get(
                    "additions",
                    0,
                )
                or 0
            ),
            deletions=int(
                github_file.get(
                    "deletions",
                    0,
                )
                or 0
            ),
            changes=int(
                github_file.get(
                    "changes",
                    0,
                )
                or 0
            ),
            patch=github_file.get(
                "patch"
            ),
            sha=github_file.get(
                "sha"
            ),
        )

    @staticmethod
    def normalize_patch(
        patch: str | None,
    ) -> str:
        """
        Normalize a GitHub unified diff.

        GitHub does not always provide a patch,
        especially for binary files or very large files.
        """

        if not patch:
            return ""

        return patch.replace(
            "\r\n",
            "\n",
        ).strip()

    @staticmethod
    def extract_changed_lines(
        patch: str | None,
    ) -> list[int]:
        """
        Extract added line numbers from a unified diff.

        Example:

        @@ -10,2 +10,4 @@

        Added lines are tracked using the new-file
        line numbering.
        """

        if not patch:
            return []

        changed_lines: list[int] = []

        current_line = None

        for line in patch.splitlines():

            if line.startswith("@@"):

                try:
                    header = line.split("@@")[1].strip()

                    new_section = header.split(" ")[1]

                    new_section = new_section.lstrip("+")

                    if "," in new_section:
                        start, _ = new_section.split(
                            ",",
                            1,
                        )
                    else:
                        start = new_section

                    current_line = int(start)

                except (
                    ValueError,
                    IndexError,
                ):
                    current_line = None

                continue

            if current_line is None:
                continue

            # Added line.
            if line.startswith("+") and not line.startswith("+++"):
                changed_lines.append(
                    current_line
                )

                current_line += 1

            # Removed line.
            elif line.startswith("-") and not line.startswith("---"):
                continue

            # Context line.
            else:
                current_line += 1

        return changed_lines

    @staticmethod
    def is_binary_file(
        github_file: dict,
    ) -> bool:
        """
        Detect files for which GitHub does not provide
        a textual patch.
        """

        filename = github_file.get(
            "filename",
            "",
        )

        patch = github_file.get(
            "patch"
        )

        binary_extensions = {
            ".png",
            ".jpg",
            ".jpeg",
            ".gif",
            ".webp",
            ".ico",
            ".bmp",
            ".svg",
            ".pdf",
            ".zip",
            ".gz",
            ".tar",
            ".7z",
            ".rar",
            ".exe",
            ".dll",
            ".so",
            ".class",
            ".jar",
            ".woff",
            ".woff2",
            ".ttf",
            ".otf",
            ".mp3",
            ".mp4",
            ".mov",
            ".avi",
        }

        extension = Path(
            filename
        ).suffix.lower()

        return (
            extension in binary_extensions
            or patch is None
        )

    @staticmethod
    def build_summary(
        files: list[DiffFile],
    ) -> dict:
        """
        Generate a high-level summary of a PR diff.
        """

        languages: dict[str, int] = {}

        total_additions = 0
        total_deletions = 0
        total_changes = 0

        for file in files:

            total_additions += file.additions
            total_deletions += file.deletions
            total_changes += file.changes

            language = file.language

            languages[language] = (
                languages.get(language, 0)
                + 1
            )

        return {
            "files_changed": len(files),
            "additions": total_additions,
            "deletions": total_deletions,
            "changes": total_changes,
            "languages": languages,
        }