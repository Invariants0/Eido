from datetime import datetime

from sqlmodel import Session, select

from ...config.settings import config
from ...models.user import User
from ...security.session_token import create_session_token


class AuthService:
    def __init__(self, session: Session):
        self.session = session

    def upsert_google_user(self, email: str, name: str, google_id: str, avatar_url: str | None) -> tuple[User, str]:
        statement = select(User).where((User.google_id == google_id) | (User.email == email))
        user = self.session.exec(statement).first()

        now = datetime.utcnow()
        if not user:
            user = User(
                email=email,
                name=name,
                google_id=google_id,
                avatar_url=avatar_url,
                created_at=now,
                updated_at=now,
            )
        else:
            user.email = email
            user.name = name
            user.google_id = google_id
            user.avatar_url = avatar_url
            user.updated_at = now

        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)

        token = create_session_token(
            {
                "user_id": user.id,
                "email": user.email,
                "google_id": user.google_id,
            },
            ttl_hours=config.SESSION_TOKEN_TTL_HOURS,
        )
        return user, token
