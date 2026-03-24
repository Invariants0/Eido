"""MVP API request/response schemas (Pydantic models)."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class MVPCreate(BaseModel):
    """Schema for creating an MVP."""

    name: str = Field(..., min_length=1, max_length=200, description="MVP name")
    idea_summary: Optional[str] = Field(None, description="Initial idea summary")
    payment_token: Optional[str] = Field(None, description="Required after free run is consumed")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not v or len(v.strip()) == 0:
            raise ValueError("Name cannot be empty or whitespace only")
        return v.strip()


class MVPUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    idea_summary: Optional[str] = None
    deployment_url: Optional[str] = None
    token_id: Optional[str] = None


class MVPResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    name: str
    status: str
    idea_summary: Optional[str] = None
    deployment_url: Optional[str] = None
    token_id: Optional[str] = None
    retry_count: int
    last_error_stage: Optional[str] = None
    last_error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MVPListResponse(BaseModel):
    items: list[MVPResponse]
    total: int
