from datetime import datetime
from typing import Dict, Optional

from sqlalchemy import Column
from sqlmodel import Field, JSON, Relationship, SQLModel


class UserUsage(SQLModel, table=True):
    """Per-user free-run and paid-run usage counters."""

    __tablename__ = "user_usage"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True, unique=True)
    free_run_consumed: bool = Field(default=False)
    free_run_consumed_at: Optional[datetime] = None
    paid_runs_count: int = Field(default=0)
    donation_count: int = Field(default=0)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional["User"] = Relationship(back_populates="usage")


class PaymentRecord(SQLModel, table=True):
    """Payment and donation records (mock-validated for MVP)."""

    __tablename__ = "payment_record"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    kind: str = Field(index=True)  # donation | run_payment
    amount: float
    currency: str = Field(default="SURGE")
    payment_token: str = Field(index=True, unique=True)
    status: str = Field(default="pending", index=True)  # pending | succeeded | failed | consumed
    metadata_json: Optional[Dict[str, str]] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)

    user: Optional["User"] = Relationship(back_populates="payments")
