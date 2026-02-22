from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class MVP(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    status: str = "pending"
    idea_summary: Optional[str] = None
    deployment_url: Optional[str] = None
    token_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
