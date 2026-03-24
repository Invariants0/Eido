from fastapi import APIRouter, Depends
from sqlmodel import Session

from ...db import get_session
from ..schemas.token import TokenCreate, TokenResponse
from ..services.token_service import TokenService

router = APIRouter()


@router.post("/create", response_model=TokenResponse)
async def create_token(payload: TokenCreate, session: Session = Depends(get_session)):
    service = TokenService(session)
    return await service.create_token(payload.mvp_id)


@router.get("/list/all", response_model=list[TokenResponse])
def list_tokens(skip: int = 0, limit: int = 100, session: Session = Depends(get_session)):
    service = TokenService(session)
    return service.list_tokens(skip=skip, limit=limit)


@router.get("/{mvp_id}", response_model=TokenResponse | None)
def get_token(mvp_id: int, session: Session = Depends(get_session)):
    service = TokenService(session)
    return service.get_token(mvp_id)
