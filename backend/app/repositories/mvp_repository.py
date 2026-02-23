"""MVP repository - database access layer only."""

from typing import List, Optional
from sqlmodel import Session, select
from ..models.mvp import MVP, MVPState


class MVPRepository:
    """Repository for MVP database operations."""
    
    def __init__(self, session: Session):
        self.session = session
    
    def create(self, mvp: MVP) -> MVP:
        """Create a new MVP."""
        self.session.add(mvp)
        self.session.commit()
        self.session.refresh(mvp)
        return mvp
    
    def get_by_id(self, mvp_id: int) -> Optional[MVP]:
        """Get MVP by ID."""
        return self.session.get(MVP, mvp_id)
    
    def list_all(self, skip: int = 0, limit: int = 100) -> List[MVP]:
        """List all MVPs with pagination."""
        statement = select(MVP).offset(skip).limit(limit).order_by(MVP.created_at.desc())
        return list(self.session.exec(statement).all())
    
    def count(self) -> int:
        """Count total MVPs."""
        statement = select(MVP)
        return len(self.session.exec(statement).all())
    
    def update(self, mvp: MVP) -> MVP:
        """Update an existing MVP."""
        self.session.add(mvp)
        self.session.commit()
        self.session.refresh(mvp)
        return mvp
    
    def find_by_state(self, state: MVPState) -> List[MVP]:
        """Find all MVPs in a specific state."""
        statement = select(MVP).where(MVP.status == state)
        return list(self.session.exec(statement).all())
    
    def find_by_states(self, states: List[MVPState]) -> List[MVP]:
        """Find all MVPs in any of the given states."""
        statement = select(MVP).where(MVP.status.in_([s.value for s in states]))
        return list(self.session.exec(statement).all())
