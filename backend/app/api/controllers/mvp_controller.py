"""MVP request handlers (controllers) - zero business logic."""

from fastapi import APIRouter, Depends, BackgroundTasks, status
from sqlmodel import Session
from typing import List

from ...db import get_session
from ..services.mvp_service import MVPService
from ..schemas.mvp import MVPCreate, MVPResponse, MVPListResponse
from ...services.pipeline import AutonomousPipeline
from ...logger import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.post("/start", response_model=MVPResponse, status_code=status.HTTP_202_ACCEPTED)
async def start_mvp_pipeline(
    mvp_data: MVPCreate,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
):
    """
    Start autonomous MVP pipeline.
    
    Creates MVP record and schedules background execution.
    Returns immediately with 202 Accepted.
    """
    service = MVPService(session)
    
    # Create MVP in CREATED state
    mvp = service.create_mvp(name=mvp_data.name, idea_summary=mvp_data.idea_summary)
    
    # Schedule pipeline execution in background
    pipeline = AutonomousPipeline(mvp.id)
    background_tasks.add_task(pipeline.run)
    
    logger.info(f"Scheduled pipeline execution for MVP {mvp.id}")
    
    return mvp


@router.get("/list", response_model=MVPListResponse)
def list_mvps(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
):
    """List all MVPs with pagination."""
    service = MVPService(session)
    mvps = service.list_mvps(skip=skip, limit=limit)
    total = service.count_mvps()
    
    return MVPListResponse(items=mvps, total=total)


@router.get("/{mvp_id}", response_model=MVPResponse)
def get_mvp(
    mvp_id: int,
    session: Session = Depends(get_session),
):
    """Get MVP by ID."""
    service = MVPService(session)
    mvp = service.get_mvp(mvp_id)
    return mvp


@router.get("/{mvp_id}/runs")
def get_mvp_runs(
    mvp_id: int,
    session: Session = Depends(get_session),
):
    """Get all agent runs for an MVP."""
    service = MVPService(session)
    runs = service.get_agent_runs(mvp_id)
    return {"mvp_id": mvp_id, "runs": runs}
