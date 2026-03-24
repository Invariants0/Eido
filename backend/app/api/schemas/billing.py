from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class BillingStatusResponse(BaseModel):
    free_run_available: bool
    free_run_consumed_at: Optional[datetime] = None
    paid_runs_count: int
    donation_count: int


class MockPaymentRequest(BaseModel):
    amount: float = Field(..., gt=0)
    kind: str = Field(..., description="donation or run_payment")
    force_fail: bool = False


class MockPaymentResponse(BaseModel):
    payment_token: Optional[str] = None
    status: str
    message: str
