from fastapi import APIRouter, Depends
from sqlmodel import Session

from ...db import get_session
from ...models.user import User
from ..dependencies.auth import get_current_user
from ..schemas.billing import BillingStatusResponse, MockPaymentRequest, MockPaymentResponse
from ..services.billing_service import BillingService

router = APIRouter()


@router.get("/status", response_model=BillingStatusResponse)
def get_billing_status(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    service = BillingService(session)
    usage = service.get_status(user)
    return BillingStatusResponse(
        free_run_available=not usage.free_run_consumed,
        free_run_consumed_at=usage.free_run_consumed_at,
        paid_runs_count=usage.paid_runs_count,
        donation_count=usage.donation_count,
    )


@router.post("/mock-payment", response_model=MockPaymentResponse)
def create_mock_payment(
    payload: MockPaymentRequest,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    service = BillingService(session)
    payment = service.create_mock_payment(
        user=user,
        amount=payload.amount,
        kind=payload.kind,
        force_fail=payload.force_fail,
    )

    if payment.status == "failed":
        return MockPaymentResponse(status="failed", message="Mock payment failed as requested")

    return MockPaymentResponse(
        status="succeeded",
        payment_token=payment.payment_token,
        message="Mock payment succeeded",
    )
