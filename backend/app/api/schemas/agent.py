"""Agent API request/response schemas."""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AgentRunCreate(BaseModel):
    """Schema for triggering an agent run."""
    mvp_id: int
    initial_stage: str = "ideation"


class AgentRunResponse(BaseModel):
    """Schema for agent run response."""
    id: int
    stage: str
    status: str
    log: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True


class AgentStatusResponse(BaseModel):
    """Schema for agent pipeline status."""
    mvp_id: int
    current_stage: str
    status: str
    progress: int  # 0-100
    last_update: datetime
