from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from typing import Optional, Dict, Any
from datetime import datetime


class AgentRun(SQLModel, table=True):
    """Agent run model tracking individual pipeline stage executions."""
    
    __tablename__ = "agent_run"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    mvp_id: int = Field(foreign_key="mvp.id", index=True)
    stage: str = Field(index=True)
    status: str
    attempt_number: int = Field(default=1)
    log: Optional[str] = None
    input_hash: Optional[str] = None
    output_hash: Optional[str] = None
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    
    # AI Runtime fields
    stage_input_json: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    stage_output_json: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    llm_model: Optional[str] = None
    token_usage: Optional[int] = Field(default=0)
    cost_estimate: Optional[float] = Field(default=0.0)
    
    # Relationship to MVP
    mvp: Optional["MVP"] = Relationship(back_populates="agent_runs")
