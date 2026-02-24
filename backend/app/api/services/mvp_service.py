"""MVP business logic and orchestration."""

from typing import List, Optional
from datetime import datetime
from sqlmodel import Session, select

from ...models.mvp import MVP, MVPState, is_valid_transition, is_non_terminal_state, is_terminal_state
from ...models.agent_run import AgentRun
from ...exceptions import NotFoundError, ValidationError, StateTransitionError, PipelineConflictError
from ...logger import get_logger

logger = get_logger(__name__)


class MVPService:
    """Service layer for MVP operations."""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create_mvp(self, name: str, idea_summary: Optional[str] = None) -> MVP:
        """Create a new MVP in CREATED state."""
        if not name or len(name.strip()) == 0:
            raise ValidationError("MVP name cannot be empty")
        
        if len(name) > 200:
            raise ValidationError("MVP name cannot exceed 200 characters")
        
        mvp = MVP(
            name=name.strip(),
            status=MVPState.CREATED,
            idea_summary=idea_summary,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        
        self.session.add(mvp)
        self.session.commit()
        self.session.refresh(mvp)
        
        logger.info(f"Created MVP {mvp.id}: {mvp.name}")
        return mvp
    
    def get_mvp(self, mvp_id: int) -> MVP:
        """Get MVP by ID."""
        mvp = self.session.get(MVP, mvp_id)
        if not mvp:
            raise NotFoundError("MVP", mvp_id)
        return mvp
    
    def list_mvps(self, skip: int = 0, limit: int = 100) -> List[MVP]:
        """List all MVPs with pagination."""
        statement = select(MVP).offset(skip).limit(limit).order_by(MVP.created_at.desc())
        mvps = self.session.exec(statement).all()
        return list(mvps)
    
    def count_mvps(self) -> int:
        """Count total MVPs."""
        statement = select(MVP)
        return len(self.session.exec(statement).all())
    
    def check_pipeline_conflict(self, mvp_id: int) -> None:
        """Check if MVP can start a new pipeline (idempotency guard)."""
        mvp = self.get_mvp(mvp_id)
        
        # Prevent starting if already in non-terminal state
        if is_non_terminal_state(mvp.status):
            raise PipelineConflictError(mvp_id, mvp.status.value)
        
        logger.info(f"Pipeline conflict check passed for MVP {mvp_id}")
    
    def transition_state(self, mvp_id: int, new_state: MVPState) -> MVP:
        """Transition MVP to new state with validation."""
        mvp = self.get_mvp(mvp_id)
        
        if not is_valid_transition(mvp.status, new_state):
            raise StateTransitionError(mvp.status.value, new_state.value)
        
        old_state = mvp.status
        mvp.status = new_state
        mvp.updated_at = datetime.utcnow()
        
        self.session.add(mvp)
        self.session.commit()
        self.session.refresh(mvp)
        
        logger.info(f"MVP {mvp_id} transitioned: {old_state.value} -> {new_state.value}")
        return mvp
    
    def get_agent_runs(self, mvp_id: int) -> List[AgentRun]:
        """Get all agent runs for an MVP."""
        statement = select(AgentRun).where(AgentRun.mvp_id == mvp_id).order_by(AgentRun.started_at)
        runs = self.session.exec(statement).all()
        return list(runs)
    
    def update_mvp(
        self,
        mvp_id: int,
        name: Optional[str] = None,
        idea_summary: Optional[str] = None,
        deployment_url: Optional[str] = None,
        token_id: Optional[str] = None,
    ) -> MVP:
        """Update MVP fields (non-state fields only)."""
        mvp = self.get_mvp(mvp_id)
        
        if name is not None:
            if len(name.strip()) == 0:
                raise ValidationError("MVP name cannot be empty")
            if len(name) > 200:
                raise ValidationError("MVP name cannot exceed 200 characters")
            mvp.name = name.strip()
        
        if idea_summary is not None:
            mvp.idea_summary = idea_summary
        
        if deployment_url is not None:
            mvp.deployment_url = deployment_url
        
        if token_id is not None:
            mvp.token_id = token_id
        
        mvp.updated_at = datetime.utcnow()
        self.session.add(mvp)
        self.session.commit()
        self.session.refresh(mvp)
        
        logger.info(f"Updated MVP {mvp_id}")
        return mvp
