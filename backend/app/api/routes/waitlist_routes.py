import csv
import io

from fastapi import APIRouter, Depends, Header
from fastapi.responses import StreamingResponse
from sqlmodel import Session

from ...config.settings import config
from ...db import get_session
from ...exceptions import EidoException
from ..schemas.waitlist import WaitlistCreate, WaitlistResponse
from ..services.waitlist_service import WaitlistService

router = APIRouter()


class ForbiddenError(EidoException):
    def __init__(self, message: str = "Forbidden"):
        super().__init__(message=message, code="FORBIDDEN", status_code=403)


@router.post("/join", response_model=WaitlistResponse)
def join_waitlist(payload: WaitlistCreate, session: Session = Depends(get_session)):
    service = WaitlistService(session)
    return service.join(name=payload.name, email=payload.email, note=payload.note)


@router.get("/list", response_model=list[WaitlistResponse])
def list_waitlist(
    skip: int = 0,
    limit: int = 200,
    x_admin_key: str | None = Header(default=None),
    session: Session = Depends(get_session),
):
    if config.ADMIN_API_KEY and x_admin_key != config.ADMIN_API_KEY:
        raise ForbiddenError("Admin key required")

    service = WaitlistService(session)
    return service.list_entries(skip=skip, limit=limit)


@router.get("/export.csv")
def export_waitlist_csv(
    x_admin_key: str | None = Header(default=None),
    session: Session = Depends(get_session),
):
    if config.ADMIN_API_KEY and x_admin_key != config.ADMIN_API_KEY:
        raise ForbiddenError("Admin key required")

    service = WaitlistService(session)
    rows = service.list_entries(skip=0, limit=10000)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "name", "email", "note", "created_at"])
    for row in rows:
        writer.writerow([row.id, row.name, row.email, row.note or "", row.created_at.isoformat()])

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=waitlist_export.csv"},
    )
