"""MVP API request/response schemas (Pydantic models)."""

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class MVPCreate(BaseModel):
    """Schema for creating an MVP."""
    name: str = Field(..., min_length=1, max_length=200)
    idea_summary: Optional[str] = None


class MVPUpdate(BaseModel):
    """Schema for updating an MVP."""
    name: Optional[str] = None
    status: Optional[str] = None
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
    created_at: datetime

    class Config:
        from_attributes = True


class MVPListResponse(BaseModel):
    """Schema for MVP list response."""
    items: list[MVPResponse]
    total: int
