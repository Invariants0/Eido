from datetime import datetime

from fastapi import APIRouter, Depends
from sqlmodel import Session

from ...db import get_session
from ...exceptions import NotFoundError
from ...models.mvp import MVP

router = APIRouter()


@router.post("/{mvp_id}", tags=["deploy"])
def deploy_mvp(mvp_id: int, session: Session = Depends(get_session)):
    mvp = session.get(MVP, mvp_id)
    if not mvp:
        raise NotFoundError("MVP", mvp_id)

    return {
        "url": mvp.deployment_url,
        "status": "ready" if mvp.deployment_url else "pending",
        "timestamp": datetime.utcnow().isoformat(),
    }
