from datetime import datetime

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ...db import get_session
from ...models.mvp import MVP, NON_TERMINAL_STATES

router = APIRouter()


@router.get("/status", tags=["agent"])
def agent_status(session: Session = Depends(get_session)):
    statement = select(MVP).where(MVP.status.in_([state.value for state in NON_TERMINAL_STATES]))
    active = list(session.exec(statement).all())
    return {
        "status": "busy" if active else "idle",
        "active_pipelines": len(active),
        "timestamp": datetime.utcnow().isoformat(),
    }
