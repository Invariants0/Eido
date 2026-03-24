from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select

from ...db import get_session
from ...exceptions import EidoException
from ...models.user import User
from ...security.session_token import verify_session_token

bearer_scheme = HTTPBearer(auto_error=False)


class UnauthorizedError(EidoException):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(message=message, code="UNAUTHORIZED", status_code=401)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: Session = Depends(get_session),
) -> User:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise UnauthorizedError()

    payload = verify_session_token(credentials.credentials)
    if not payload:
        raise UnauthorizedError("Invalid or expired session token")

    user_id = payload.get("user_id")
    if not user_id:
        raise UnauthorizedError("Malformed session token")

    statement = select(User).where(User.id == int(user_id))
    user = session.exec(statement).first()
    if not user:
        raise UnauthorizedError("User not found")

    return user
