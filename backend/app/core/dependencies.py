from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.database import get_db
from app.models.user import User


security = HTTPBearer(
    auto_error=False,
)


# ============================================================
# AUTHENTICATION ERROR
# ============================================================

def authentication_error(
    detail: str = "Could not validate credentials",
) -> HTTPException:
    """
    Create a consistent authentication error.
    """

    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )


# ============================================================
# CURRENT USER
# ============================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        security
    ),
    access_token: str | None = Cookie(
        default=None,
    ),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Authenticate the current request using either:

    1. Authorization: Bearer <access_token>
    2. HttpOnly access_token cookie

    Authorization header takes priority if both are present.
    """

    # --------------------------------------------------------
    # 1. Get token from Authorization header
    # --------------------------------------------------------

    token: str | None = None

    if credentials is not None:
        token = credentials.credentials

    # --------------------------------------------------------
    # 2. Fall back to HttpOnly cookie
    # --------------------------------------------------------

    if not token and access_token:
        token = access_token

    # --------------------------------------------------------
    # 3. No token provided
    # --------------------------------------------------------

    if not token:
        raise authentication_error()

    # --------------------------------------------------------
    # 4. Decode and validate JWT
    # --------------------------------------------------------

    try:
        payload = decode_token(token)

    except Exception:
        raise authentication_error(
            "Invalid or expired token"
        )

    # --------------------------------------------------------
    # 5. Make sure this is an access token
    # --------------------------------------------------------

    token_type = payload.get("type")

    if token_type != "access":
        raise authentication_error(
            "Invalid access token"
        )

    # --------------------------------------------------------
    # 6. Extract user ID
    # --------------------------------------------------------

    subject = payload.get("sub")

    if subject is None:
        raise authentication_error(
            "Invalid token payload"
        )

    # --------------------------------------------------------
    # 7. Convert user ID
    # --------------------------------------------------------

    try:
        user_id = int(subject)

    except (
        TypeError,
        ValueError,
    ):
        raise authentication_error(
            "Invalid token subject"
        )

    # --------------------------------------------------------
    # 8. Protect against invalid/non-positive IDs
    # --------------------------------------------------------

    if user_id <= 0:
        raise authentication_error(
            "Invalid token subject"
        )

    # --------------------------------------------------------
    # 9. Find user
    # --------------------------------------------------------

    result = await db.execute(
        select(User).where(
            User.id == user_id
        )
    )

    user = result.scalar_one_or_none()

    
    if user is None:
        raise authentication_error(
            "User no longer exists"
        )

    return user