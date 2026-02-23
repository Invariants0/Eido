from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum


class MVPState(str, Enum):
    """Strict state machine for MVP lifecycle."""
    CREATED = "CREATED"
    IDEATING = "IDEATING"
    ARCHITECTING = "ARCHITECTING"
    BUILDING = "BUILDING"
    BUILD_FAILED = "BUILD_FAILED"
    DEPLOYING = "DEPLOYING"
    DEPLOY_FAILED = "DEPLOY_FAILED"
    TOKENIZING = "TOKENIZING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


# Valid state transitions
VALID_TRANSITIONS = {
    MVPState.CREATED: [MVPState.IDEATING],
    MVPState.IDEATING: [MVPState.ARCHITECTING, MVPState.FAILED],
    MVPState.ARCHITECTING: [MVPState.BUILDING, MVPState.FAILED],
    MVPState.BUILDING: [MVPState.DEPLOYING, MVPState.BUILD_FAILED],
    MVPState.BUILD_FAILED: [MVPState.BUILDING, MVPState.FAILED],
    MVPState.DEPLOYING: [MVPState.TOKENIZING, MVPState.DEPLOY_FAILED],
    MVPState.DEPLOY_FAILED: [MVPState.DEPLOYING, MVPState.FAILED],
    MVPState.TOKENIZING: [MVPState.COMPLETED, MVPState.FAILED],
    MVPState.COMPLETED: [],
    MVPState.FAILED: [],
}


# Terminal states that cannot transition
TERMINAL_STATES = {MVPState.COMPLETED, MVPState.FAILED}


# Non-terminal states (pipeline in progress)
NON_TERMINAL_STATES = {
    MVPState.CREATED,
    MVPState.IDEATING,
    MVPState.ARCHITECTING,
    MVPState.BUILDING,
    MVPState.BUILD_FAILED,
    MVPState.DEPLOYING,
    MVPState.DEPLOY_FAILED,
    MVPState.TOKENIZING,
}


class MVP(SQLModel, table=True):
    """MVP model with strict state machine."""
    
    __tablename__ = "mvp"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    status: MVPState = Field(default=MVPState.CREATED)
    idea_summary: Optional[str] = None
    deployment_url: Optional[str] = None
    token_id: Optional[str] = None
    retry_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # AI Runtime tracking fields
    total_token_usage: int = Field(default=0)
    total_cost_estimate: float = Field(default=0.0)
    max_allowed_cost: float = Field(default=10.0)  # USD
    execution_trace_id: Optional[str] = None
    last_error_stage: Optional[str] = None
    
    # Relationship to agent runs
    agent_runs: List["AgentRun"] = Relationship(back_populates="mvp")


def is_valid_transition(from_state: MVPState, to_state: MVPState) -> bool:
    """Check if state transition is valid."""
    return to_state in VALID_TRANSITIONS.get(from_state, [])


def is_terminal_state(state: MVPState) -> bool:
    """Check if state is terminal."""
    return state in TERMINAL_STATES


def is_non_terminal_state(state: MVPState) -> bool:
    """Check if state is non-terminal (pipeline in progress)."""
    return state in NON_TERMINAL_STATES
