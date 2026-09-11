from pydantic import BaseModel


class ChangedLineResponse(BaseModel):
    line: int


class DiffFileResponse(BaseModel):
    filename: str
    status: str
    additions: int
    deletions: int
    changes: int
    language: str
    patch: str | None
    sha: str | None
    changed_lines: list[int]


class DiffSummaryResponse(BaseModel):
    files_changed: int
    additions: int
    deletions: int
    changes: int
    languages: dict[str, int]


class PullRequestDiffResponse(BaseModel):
    repository_id: int
    pull_request_number: int
    files: list[DiffFileResponse]
    summary: DiffSummaryResponse