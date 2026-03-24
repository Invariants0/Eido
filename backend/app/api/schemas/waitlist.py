from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class WaitlistCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    note: Optional[str] = Field(default=None, max_length=500)


class WaitlistResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
