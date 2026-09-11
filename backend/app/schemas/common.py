from uuid import UUID

from pydantic import BaseModel, Field


class RepositoryCreate(BaseModel):
    owner: str = Field(min_length=1, max_length=255)
    name: str = Field(min_length=1, max_length=255)
    language: str | None = Field(default=None, max_length=100)


class ReviewCreate(BaseModel):
    repository_id: UUID
    pull_request_number: int | None = Field(default=None, ge=1)