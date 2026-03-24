from datetime import datetime

from sqlmodel import Session, select

from ...exceptions import ConflictError
from ...models.waitlist import WaitlistEntry


class WaitlistService:
    def __init__(self, session: Session):
        self.session = session

    def join(self, name: str, email: str, note: str | None) -> WaitlistEntry:
        existing = self.session.exec(select(WaitlistEntry).where(WaitlistEntry.email == email)).first()
        if existing:
            raise ConflictError("Email is already on the waitlist")

        entry = WaitlistEntry(name=name.strip(), email=email.lower().strip(), note=note, created_at=datetime.utcnow())
        self.session.add(entry)
        self.session.commit()
        self.session.refresh(entry)
        return entry

    def list_entries(self, skip: int = 0, limit: int = 200) -> list[WaitlistEntry]:
        statement = select(WaitlistEntry).offset(skip).limit(limit).order_by(WaitlistEntry.created_at.desc())
        return list(self.session.exec(statement).all())
