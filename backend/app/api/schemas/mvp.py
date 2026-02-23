"""MVP API request/response schemas (Pydantic models)."""

from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from typing import Optional


class MVPCreate(BaseModel):
    """Schema for creating an MVP."""
    name: str = Field(..., min_length=1, max_length=200, description="MVP name")
    idea_summary: Optional[str] = Field(None, description="Initial idea summary")
    
    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate and sanitize name."""
        if not v or len(v.strip()) == 0:
            raise ValueError("Name cannot be empty or whitespace only")
        return v.strip()


class MVPUpdate(BaseModel):
    """Schema for updating an MVP."""
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    idea_summary: Optional[str] = None
    deployment_url: Optional[str] = None
    token_id: Optional[str] = None


class MVPResponse(BaseModel):
    """Schema for MVP response."""
    id: int
    name: str
    status: str
    idea_summary: Optional[str] = None
    deployment_url: Optional[str] = None
    token_id: Optional[str] = None
    retry_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MVPListResponse(BaseModel):
    """Schema for MVP list response."""
    items: list[MVPResponse]
    total: int
