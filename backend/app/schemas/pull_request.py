from datetime import datetime

from pydantic import BaseModel, ConfigDict


class PullRequestResponse(BaseModel):
    id: int
    repository_id: int
    title: str
    github_pr_id: str
    number: int
    description: str | None
    state: str
    source_branch: str
    target_branch: str
    author: str | None
    html_url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class PullRequestFileResponse(BaseModel):
    filename: str
    status: str | None = None
    additions: int = 0
    deletions: int = 0
    changes: int = 0
    patch: str | None = None
    sha: str | None = None