from datetime import datetime, timedelta, timezone
from typing import Any

import hashlib
import secrets

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import (
    InvalidHashError,
    VerificationError,
    VerifyMismatchError,
)

from app.config import settings


password_hasher = PasswordHasher()


# ============================================================
# PASSWORD SECURITY
# ============================================================

def hash_password(password: str) -> str:
    """
    Hash a plain-text password using Argon2.
    """
    return password_hasher.hash(password)


def verify_password(
    password: str,
    password_hash: str,
) -> bool:
    """
    Verify a plain-text password against an Argon2 hash.
    """

    try:
        return password_hasher.verify(
            password_hash,
            password,
        )

    except (
        VerifyMismatchError,
        VerificationError,
        InvalidHashError,
    ):
        return False


# ============================================================
# ACCESS TOKENS
# ============================================================

def create_access_token(
    subject: str,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a short-lived JWT access token.

    The token contains:
    - sub  -> user ID
    - type -> access
    - iat  -> issued-at timestamp
    - exp  -> expiration timestamp
    """

    if expires_delta is None:
        expires_delta = timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    now = datetime.now(timezone.utc)
    expire = now + expires_delta

    payload: dict[str, Any] = {
        "sub": subject,
        "type": "access",
        "exp": expire,
        "iat": now,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


# ============================================================
# JWT REFRESH TOKENS
# ============================================================

def create_refresh_token(
    subject: str,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a JWT refresh token.

    NOTE:
    This function creates the signed JWT itself.

    The raw refresh token should NOT be stored directly
    in the database.

    The authentication layer should:
        1. Generate the refresh JWT.
        2. Hash it using hash_refresh_token().
        3. Store only the hash in refresh_tokens.
    """

    if expires_delta is None:
        expires_delta = timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

    now = datetime.now(timezone.utc)
    expire = now + expires_delta

    payload: dict[str, Any] = {
        "sub": subject,
        "type": "refresh",
        "exp": expire,
        "iat": now,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM,
    )


# ============================================================
# RANDOM REFRESH TOKEN
# ============================================================

def generate_refresh_token() -> str:
    """
    Generate a cryptographically secure random token.

    This can be used when implementing opaque refresh tokens.

    64 random bytes are generated and encoded using URL-safe
    Base64 encoding.

    The resulting token is approximately 86 characters long.
    """

    return secrets.token_urlsafe(64)


# ============================================================
# REFRESH TOKEN HASHING
# ============================================================

def hash_refresh_token(token: str) -> str:
    """
    Hash a refresh token before storing it in the database.

    The raw refresh token must never be persisted.

    SHA-256 produces a 64-character hexadecimal digest.
    """

    return hashlib.sha256(
        token.encode("utf-8")
    ).hexdigest()


# ============================================================
# JWT DECODING
# ============================================================

def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT.

    Raises jwt.InvalidTokenError when the token is:
    - invalid
    - expired
    - malformed
    - signed incorrectly
    """

    return jwt.decode(
        token,
        settings.JWT_SECRET,
        algorithms=[settings.JWT_ALGORITHM],
    )