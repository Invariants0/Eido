from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class WaitlistEntry(SQLModel, table=True):
    """Stores beta waitlist submissions."""

    __tablename__ = "waitlist_entry"

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    email: str = Field(index=True, unique=True)
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
