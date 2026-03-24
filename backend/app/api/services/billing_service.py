import hashlib
from datetime import datetime

from sqlmodel import Session, select

from ...exceptions import EidoException
from ...models.billing import PaymentRecord, UserUsage
from ...models.user import User


class PaymentRequiredError(EidoException):
    def __init__(self, message: str = "Payment required for additional runs"):
        super().__init__(message=message, code="PAYMENT_REQUIRED", status_code=402)


class BillingService:
    def __init__(self, session: Session):
        self.session = session

    def get_or_create_usage(self, user: User) -> UserUsage:
        usage = self.session.exec(select(UserUsage).where(UserUsage.user_id == user.id)).first()
        if usage:
            return usage

        usage = UserUsage(user_id=user.id, updated_at=datetime.utcnow())
        self.session.add(usage)
        self.session.commit()
        self.session.refresh(usage)
        return usage

    def get_status(self, user: User) -> UserUsage:
        return self.get_or_create_usage(user)

    def create_mock_payment(self, user: User, amount: float, kind: str, force_fail: bool = False) -> PaymentRecord:
        usage = self.get_or_create_usage(user)
        status = "failed" if force_fail else "succeeded"
        entropy = f"{user.id}:{kind}:{amount}:{datetime.utcnow().isoformat()}"
        payment_token = f"mockpay_{hashlib.sha256(entropy.encode()).hexdigest()[:24]}"

        payment = PaymentRecord(
            user_id=user.id,
            kind=kind,
            amount=amount,
            payment_token=payment_token,
            status=status,
            metadata_json={"force_fail": str(force_fail)},
            created_at=datetime.utcnow(),
        )
        self.session.add(payment)

        if status == "succeeded" and kind == "donation":
            usage.donation_count += 1
            usage.updated_at = datetime.utcnow()
            self.session.add(usage)

        self.session.commit()
        self.session.refresh(payment)
        return payment

    def authorize_run(self, user: User, payment_token: str | None) -> UserUsage:
        usage = self.get_or_create_usage(user)

        if not usage.free_run_consumed:
            usage.free_run_consumed = True
            usage.free_run_consumed_at = datetime.utcnow()
            usage.updated_at = datetime.utcnow()
            self.session.add(usage)
            self.session.commit()
            self.session.refresh(usage)
            return usage

        if not payment_token:
            raise PaymentRequiredError()

        payment = self.session.exec(
            select(PaymentRecord).where(
                PaymentRecord.user_id == user.id,
                PaymentRecord.payment_token == payment_token,
                PaymentRecord.kind == "run_payment",
            )
        ).first()

        if not payment or payment.status != "succeeded":
            raise PaymentRequiredError("Invalid or failed payment token")

        payment.status = "consumed"
        usage.paid_runs_count += 1
        usage.updated_at = datetime.utcnow()
        self.session.add(payment)
        self.session.add(usage)
        self.session.commit()
        self.session.refresh(usage)
        return usage
