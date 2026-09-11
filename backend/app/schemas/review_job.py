from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ReviewJobResponse(BaseModel):
    job_id: int
    review_id: int
    repository_id: int
    status: str
    error: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )