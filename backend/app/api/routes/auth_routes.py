from fastapi import APIRouter, Depends
from sqlmodel import Session

from ...db import get_session
from ...integrations.surge import SurgeTokenManager
from ..dependencies.auth import get_current_user
from ..schemas.auth import AuthSessionCreate, AuthSessionResponse, UserResponse
from ..services.auth_service import AuthService

router = APIRouter()


@router.post("/session", response_model=AuthSessionResponse)
def create_backend_session(payload: AuthSessionCreate, session: Session = Depends(get_session)):
    service = AuthService(session)
    user, access_token = service.upsert_google_user(
        email=payload.email,
        name=payload.name,
        google_id=payload.google_id,
        avatar_url=payload.avatar_url,
    )
    return AuthSessionResponse(access_token=access_token, expires_in_hours=168, user=user)


@router.get("/me", response_model=UserResponse)
def me(user=Depends(get_current_user)):
    return user


@router.get("/surge-status")
def surge_auth_status():
    return SurgeTokenManager().auth_status()
