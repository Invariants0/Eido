from datetime import datetime
from typing import Optional

from sqlmodel import Session, select

from ...exceptions import NotFoundError
from ...integrations.surge import SurgeTokenManager
from ...models.mvp import MVP
from ...models.token import Token


class TokenService:
    def __init__(self, session: Session):
        self.session = session
        self.surge = SurgeTokenManager()

    def get_token(self, mvp_id: int) -> Optional[Token]:
        statement = select(Token).where(Token.mvp_id == mvp_id).order_by(Token.created_at.desc())
        return self.session.exec(statement).first()

    def list_tokens(self, skip: int = 0, limit: int = 100) -> list[Token]:
        statement = select(Token).offset(skip).limit(limit).order_by(Token.created_at.desc())
        return list(self.session.exec(statement).all())

    async def create_token(self, mvp_id: int) -> Token:
        mvp = self.session.get(MVP, mvp_id)
        if not mvp:
            raise NotFoundError("MVP", mvp_id)

        existing = self.get_token(mvp_id)
        if existing:
            return existing

        symbol = "".join(ch for ch in mvp.name.upper() if ch.isalnum())[:5] or "MVP"
        result = await self.surge.create_token(mvp_id=mvp.id, name=mvp.name, symbol=symbol)

        token = Token(
            mvp_id=mvp.id,
            contract_address=result.get("contract_address") or result.get("token_address"),
            created_at=datetime.utcnow(),
        )
        self.session.add(token)

        mvp.token_id = result.get("token_id")
        self.session.add(mvp)

        self.session.commit()
        self.session.refresh(token)
        return token
