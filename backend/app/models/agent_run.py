from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime

class AgentRun(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    stage: str
    status: str
    log: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
