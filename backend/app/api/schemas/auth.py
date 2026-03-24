from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class AuthSessionCreate(BaseModel):
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=200)
    google_id: str = Field(..., min_length=1)
    avatar_url: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    google_id: str
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AuthSessionResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_hours: int
    user: UserResponse
