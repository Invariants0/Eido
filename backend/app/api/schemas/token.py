"""Token API request/response schemas."""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TokenCreate(BaseModel):
    """Schema for creating a token."""
    mvp_id: int


class TokenResponse(BaseModel):
    """Schema for token response."""
    id: int
    mvp_id: int
    contract_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
