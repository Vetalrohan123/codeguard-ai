from pydantic import BaseModel, ConfigDict


class ReviewFileResponse(BaseModel):
    path: str
    language: str
    content: str
    findings_count: int = 0

    model_config = ConfigDict(from_attributes=True)