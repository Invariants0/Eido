"""Lightweight HMAC-signed session tokens for backend API auth."""

import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from ..config.settings import config


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def create_session_token(payload: Dict[str, Any], ttl_hours: Optional[int] = None) -> str:
    """Create signed token with exp timestamp."""
    expires_in = ttl_hours or config.SESSION_TOKEN_TTL_HOURS
    body = dict(payload)
    body["exp"] = int((datetime.now(timezone.utc) + timedelta(hours=expires_in)).timestamp())
    body_bytes = json.dumps(body, separators=(",", ":")).encode("utf-8")
    payload_part = _b64url_encode(body_bytes)
    signature = hmac.new(
        config.BACKEND_JWT_SECRET.encode("utf-8"),
        payload_part.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return f"{payload_part}.{_b64url_encode(signature)}"


def verify_session_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify signature and expiry. Returns payload or None."""
    try:
        payload_part, sig_part = token.split(".", 1)
    except ValueError:
        return None

    expected_sig = hmac.new(
        config.BACKEND_JWT_SECRET.encode("utf-8"),
        payload_part.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    provided_sig = _b64url_decode(sig_part)
    if not hmac.compare_digest(expected_sig, provided_sig):
        return None

    payload = json.loads(_b64url_decode(payload_part).decode("utf-8"))
    exp = payload.get("exp")
    if not exp or int(exp) < int(datetime.now(timezone.utc).timestamp()):
        return None
    return payload
