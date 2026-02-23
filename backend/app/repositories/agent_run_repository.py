"""AgentRun repository - database access layer only."""

from typing import List, Optional
from sqlmodel import Session, select
from ..models.agent_run import AgentRun


class AgentRunRepository:
    """Repository for AgentRun database operations."""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, agent_run: AgentRun) -> AgentRun:
        """Create a new agent run."""
        self.session.add(agent_run)
        self.session.commit()
        self.session.refresh(agent_run)
        return agent_run
    
    def get_by_id(self, run_id: int) -> Optional[AgentRun]:
        """Get agent run by ID."""
        return self.session.get(AgentRun, run_id)
    
    def find_by_mvp_id(self, mvp_id: int) -> List[AgentRun]:
        """Find all agent runs for a specific MVP."""
        statement = select(AgentRun).where(AgentRun.mvp_id == mvp_id).order_by(AgentRun.started_at)
        return list(self.session.exec(statement).all())
    
    def find_by_stage(self, mvp_id: int, stage: str) -> List[AgentRun]:
        """Find all agent runs for a specific MVP and stage."""
        statement = (
            select(AgentRun)
            .where(AgentRun.mvp_id == mvp_id, AgentRun.stage == stage)
            .order_by(AgentRun.started_at)
        )
        return list(self.session.exec(statement).all())
    
    def update(self, agent_run: AgentRun) -> AgentRun:
        """Update an existing agent run."""
        self.session.add(agent_run)
        self.session.commit()
        self.session.refresh(agent_run)
        return agent_run
