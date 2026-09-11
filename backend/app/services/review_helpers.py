from __future__ import annotations

from typing import Any


def is_reviewable_file(
    github_file: dict[str, Any],
) -> bool:
    filename = github_file.get(
        "filename",
        "",
    )

    if not filename:
        return False

    status = github_file.get(
        "status"
    )

    if status == "removed":
        return False

    if github_file.get(
        "binary",
        False,
    ):
        return False

    supported_extensions = (
        ".js",
        ".jsx",
        ".ts",
        ".tsx",
        ".py",
        ".java",
        ".c",
        ".cpp",
        ".cc",
        ".cxx",
        ".h",
        ".hpp",
        ".go",
        ".rs",
    )

    return filename.lower().endswith(
        supported_extensions
    )


def build_review_summary(
    *,
    files_analyzed: int,
    files_failed: int,
    findings_count: int,
    ai_findings_count: int,
    static_findings_count: int,
    skipped_files_count: int,
    status_value: str,
    static_failed: bool,
    ai_failed: bool,
) -> str:

    if ai_failed:
        summary = (
            "AI review failed. "
            f"{files_analyzed} files were analyzed "
            f"and {files_failed} files failed analysis. "
            f"Static analysis produced "
            f"{static_findings_count} findings."
        )

    elif (
        status_value == "partial"
    ):
        summary = (
            f"Analyzed {files_analyzed} files, "
            f"{files_failed} files failed, "
            f"and found {findings_count} issues "
            f"({ai_findings_count} AI, "
            f"{static_findings_count} static)."
        )

    elif static_failed:
        summary = (
            f"Analyzed {files_analyzed} files "
            f"and found {findings_count} issues "
            f"({ai_findings_count} AI, "
            f"{static_findings_count} static). "
            "Static analysis was partially unavailable."
        )

    else:
        summary = (
            f"Analyzed {files_analyzed} files "
            f"and found {findings_count} issues "
            f"({ai_findings_count} AI, "
            f"{static_findings_count} static)."
        )

    if skipped_files_count > 0:
        summary += (
            f" {skipped_files_count} files were skipped."
        )

    return summary