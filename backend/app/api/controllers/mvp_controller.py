"""MVP request handlers (controllers) - zero business logic."""

import asyncio
import json
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, status
from fastapi.responses import StreamingResponse
from sqlmodel import Session

from ...db import get_session
from ...logger import get_logger
from ...models.user import User
from ...monitoring.metrics import mvp_created_total
from ...services.pipeline import AutonomousPipeline
from ..dependencies.auth import get_current_user
from ..schemas.mvp import MVPCreate, MVPListResponse, MVPResponse
from ..services.billing_service import BillingService
from ..services.mvp_service import MVPService

logger = get_logger(__name__)
router = APIRouter()


@router.post("/start", response_model=MVPResponse, status_code=status.HTTP_202_ACCEPTED)
async def start_mvp_pipeline(
    mvp_data: MVPCreate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    service = MVPService(session)
    billing_service = BillingService(session)

    billing_service.authorize_run(user, mvp_data.payment_token)

    mvp = service.create_mvp(name=mvp_data.name, idea_summary=mvp_data.idea_summary, user_id=user.id)
    mvp_created_total.inc()

    pipeline = AutonomousPipeline(mvp.id)
    background_tasks.add_task(pipeline.run)

    logger.info(f"Scheduled pipeline execution for MVP {mvp.id} (user {user.id})")
    return mvp


@router.get("/list", response_model=MVPListResponse)
def list_mvps(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    service = MVPService(session)
    mvps = service.list_mvps(skip=skip, limit=limit, user_id=user.id)
    total = service.count_mvps(user_id=user.id)

    if total == 0:
        logger.info("User has no MVPs yet, returning empty list")
        return MVPListResponse(items=[], total=0)

    return MVPListResponse(items=mvps, total=total)


@router.get("/{mvp_id}", response_model=MVPResponse)
def get_mvp(
    mvp_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    service = MVPService(session)
    return service.get_mvp(mvp_id, user_id=user.id)


@router.get("/{mvp_id}/runs")
def get_mvp_runs(
    mvp_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    service = MVPService(session)
    runs = service.get_agent_runs(mvp_id, user_id=user.id)
    return {"mvp_id": mvp_id, "runs": runs}


@router.get("/{mvp_id}/events")
async def stream_mvp_events(
    mvp_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    service = MVPService(session)
    service.get_mvp(mvp_id, user_id=user.id)

    from ...services.sse_service import sse_manager

    async def sse_event_generator():
        queue = await sse_manager.subscribe(mvp_id)
        try:
            connect_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "type": "connect",
                "data": {"status": "connected", "mvp_id": mvp_id},
            }
            yield f"event: connect\ndata: {json.dumps(connect_data)}\n\n"

            while True:
                message = await queue.get()
                yield message
        except asyncio.CancelledError:
            sse_manager.unsubscribe(mvp_id, queue)

    return StreamingResponse(
        sse_event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        },
    )
