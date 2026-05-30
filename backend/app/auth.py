from __future__ import annotations

import hashlib
import os
import secrets
import sqlite3
import uuid
from typing import Optional

import jwt
from fastapi import Header, HTTPException
from jwt import PyJWKClient

from .db import get_conn, now_iso

APPLE_ISSUER = "https://appleid.apple.com"
APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"
APPLE_AUDIENCE = os.environ.get("MEALMATE_APPLE_AUDIENCE", "com.xinray.mealmate")

_jwks_client = PyJWKClient(APPLE_JWKS_URL, cache_keys=True)


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def verify_apple_identity_token(identity_token: str) -> dict:
    """Verify Apple JWT and return decoded claims (sub, email, ...)."""
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(identity_token)
        claims = jwt.decode(
            identity_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=APPLE_AUDIENCE,
            issuer=APPLE_ISSUER,
        )
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail=f"invalid apple token: {exc}") from exc
    if not claims.get("sub"):
        raise HTTPException(status_code=401, detail="apple token missing sub")
    return claims


def upsert_user_by_apple(apple_sub: str, email: Optional[str]) -> str:
    """Returns user_id (existing or newly created)."""
    ts = now_iso()
    with get_conn() as conn:
        row = conn.execute(
            "SELECT id, email FROM users WHERE apple_sub = ?", (apple_sub,)
        ).fetchone()
        if row:
            user_id = row["id"]
            # Apple may stop sending email after first sign-in; only update if it changed
            if email and email != row["email"]:
                conn.execute(
                    "UPDATE users SET email = ?, updated_at = ? WHERE id = ?",
                    (email, ts, user_id),
                )
            else:
                conn.execute("UPDATE users SET updated_at = ? WHERE id = ?", (ts, user_id))
            return user_id
        user_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO users (id, apple_sub, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, apple_sub, email, ts, ts),
        )
        return user_id


def issue_session_token(user_id: str) -> str:
    """Generate a session token, store its sha256 hash, return the raw token."""
    token = secrets.token_urlsafe(32)
    ts = now_iso()
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO sessions (token_hash, user_id, created_at, last_used_at) VALUES (?, ?, ?, ?)",
            (_hash_token(token), user_id, ts, ts),
        )
    return token


def _user_id_from_token(token: str) -> Optional[str]:
    with get_conn() as conn:
        row = conn.execute(
            "SELECT user_id FROM sessions WHERE token_hash = ?", (_hash_token(token),)
        ).fetchone()
        if not row:
            return None
        conn.execute(
            "UPDATE sessions SET last_used_at = ? WHERE token_hash = ?",
            (now_iso(), _hash_token(token)),
        )
        return row["user_id"]


def require_user(authorization: Optional[str] = Header(default=None)) -> str:
    """FastAPI dependency: resolve current user_id from Authorization: Bearer header."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    user_id = _user_id_from_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="invalid session")
    return user_id


def revoke_token(token: str) -> None:
    with get_conn() as conn:
        conn.execute("DELETE FROM sessions WHERE token_hash = ?", (_hash_token(token),))


def revoke_all_for_user(user_id: str) -> None:
    with get_conn() as conn:
        conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))


def delete_user(user_id: str) -> None:
    """Cascade deletes sessions and user_data via FK ON DELETE CASCADE."""
    with get_conn() as conn:
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
