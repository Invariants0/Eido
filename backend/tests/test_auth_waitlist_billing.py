from fastapi.testclient import TestClient
from sqlmodel import SQLModel

from app.db import engine
from app.main import app


def _reset_db():
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)


def _create_session(client: TestClient) -> str:
    resp = client.post(
        "/api/auth/session",
        json={
            "email": "alpha@example.com",
            "name": "Alpha Tester",
            "google_id": "google-123",
            "avatar_url": "https://example.com/a.png",
        },
    )
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    return token


def test_auth_session_and_me():
    _reset_db()
    client = TestClient(app)
    token = _create_session(client)

    me = client.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    body = me.json()
    assert body["email"] == "alpha@example.com"
    assert body["google_id"] == "google-123"


def test_waitlist_join_and_duplicate_protection():
    _reset_db()
    client = TestClient(app)

    first = client.post(
        "/api/waitlist/join",
        json={"name": "Alice", "email": "alice@example.com", "note": "interested"},
    )
    assert first.status_code == 200

    duplicate = client.post(
        "/api/waitlist/join",
        json={"name": "Alice", "email": "alice@example.com", "note": "again"},
    )
    assert duplicate.status_code == 409


def test_billing_status_and_mock_payment_flow():
    _reset_db()
    client = TestClient(app)
    token = _create_session(client)
    headers = {"Authorization": f"Bearer {token}"}

    status_before = client.get("/api/billing/status", headers=headers)
    assert status_before.status_code == 200
    assert status_before.json()["free_run_available"] is True

    payment = client.post(
        "/api/billing/mock-payment",
        headers=headers,
        json={"amount": 1.0, "kind": "donation", "force_fail": False},
    )
    assert payment.status_code == 200
    assert payment.json()["status"] == "succeeded"

    status_after = client.get("/api/billing/status", headers=headers)
    assert status_after.status_code == 200
    assert status_after.json()["donation_count"] == 1
