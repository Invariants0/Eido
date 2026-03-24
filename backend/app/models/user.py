from datetime import datetime
from typing import List, Optional

from sqlmodel import Field, Relationship, SQLModel


class User(SQLModel, table=True):
    """Authenticated user profile mapped from Google OAuth identity."""

    __tablename__ = "user"

    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    name: str
    google_id: str = Field(index=True, unique=True)
    avatar_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # Relationships
    mvps: List["MVP"] = Relationship(back_populates="user")
    usage: Optional["UserUsage"] = Relationship(back_populates="user")
    payments: List["PaymentRecord"] = Relationship(back_populates="user")
