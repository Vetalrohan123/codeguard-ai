from datetime import datetime, timezone

import jwt
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Request,
    Response,
    status,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.dependencies import get_current_user
from app.core.rate_limit import limiter
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.database import get_db
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import (
    RefreshTokenRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

def authentication_error(
    detail: str = "Invalid or expired token",
) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={
            "WWW-Authenticate": "Bearer",
        },
    )


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
) -> None:
    """
    Set authentication tokens as HttpOnly cookies.

    Development:
        COOKIE_SECURE=false
        COOKIE_HTTP_ONLY=true
        COOKIE_SAME_SITE=lax

    Production:
        COOKIE_SECURE=true
        COOKIE_HTTP_ONLY=true
        COOKIE_SAME_SITE=none
    """

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=settings.COOKIE_HTTP_ONLY,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAME_SITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/",
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=settings.COOKIE_HTTP_ONLY,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAME_SITE,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/",
    )


def clear_auth_cookies(
    response: Response,
) -> None:
    """
    Remove authentication cookies.
    """

    response.delete_cookie(
        key="access_token",
        path="/",
    )

    response.delete_cookie(
        key="refresh_token",
        path="/",
    )


def get_refresh_token_expiration(
    refresh_token: str,
) -> datetime:
    """
    Extract the expiration time from a validated refresh JWT.
    """

    payload = decode_token(
        refresh_token
    )

    exp = payload.get("exp")

    if exp is None:
        raise authentication_error(
            "Invalid refresh token expiration"
        )

    try:
        return datetime.fromtimestamp(
            float(exp),
            tz=timezone.utc,
        )

    except (
        TypeError,
        ValueError,
        OverflowError,
    ):
        raise authentication_error(
            "Invalid refresh token expiration"
        )


async def store_refresh_token(
    db: AsyncSession,
    user_id: int,
    refresh_token: str,
    expires_at: datetime,
) -> RefreshToken:
    """
    Store only the SHA-256 hash of a refresh token.

    The raw refresh token is never stored in PostgreSQL.
    """

    token_record = RefreshToken(
        user_id=user_id,
        token_hash=hash_refresh_token(
            refresh_token
        ),
        expires_at=expires_at,
    )

    db.add(token_record)

    await db.flush()

    return token_record


# ============================================================
# REGISTER
# ============================================================

@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("3/minute")
async def register(
    request: Request,
    data: UserRegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user and create an access/refresh token pair.

    Rate limit:
        3 requests per minute per IP.
    """

    result = await db.execute(
        select(User).where(
            User.email == data.email
        )
    )

    existing_user = result.scalar_one_or_none()

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email is already registered",
        )

    now = datetime.now(timezone.utc)

    user = User(
        email=data.email,
        password_hash=hash_password(
            data.password
        ),
        name=data.name,
        created_at=now,
        updated_at=now,
    )

    db.add(user)

    try:
        # Flush first so user.id is available
        # without committing.
        await db.flush()

        access_token = create_access_token(
            str(user.id)
        )

        refresh_token = create_refresh_token(
            str(user.id)
        )

        refresh_expires_at = (
            get_refresh_token_expiration(
                refresh_token
            )
        )

        await store_refresh_token(
            db=db,
            user_id=user.id,
            refresh_token=refresh_token,
            expires_at=refresh_expires_at,
        )

        await db.commit()

        await db.refresh(user)

    except Exception:
        await db.rollback()
        raise

    # --------------------------------------------------------
    # Set secure authentication cookies
    # --------------------------------------------------------

    set_auth_cookies(
        response=response,
        access_token=access_token,
        refresh_token=refresh_token,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=(
            settings.ACCESS_TOKEN_EXPIRE_MINUTES
            * 60
        ),
    )


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
)
@limiter.limit("5/minute")
async def login(
    request: Request,
    data: UserLoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate an existing user and create a new
    refresh-token session.

    Rate limit:
        5 requests per minute per IP.
    """

    result = await db.execute(
        select(User).where(
            User.email == data.email
        )
    )

    user = result.scalar_one_or_none()

    if user is None or not verify_password(
        data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={
                "WWW-Authenticate": "Bearer",
            },
        )

    access_token = create_access_token(
        str(user.id)
    )

    refresh_token = create_refresh_token(
        str(user.id)
    )

    refresh_expires_at = (
        get_refresh_token_expiration(
            refresh_token
        )
    )

    try:
        await store_refresh_token(
            db=db,
            user_id=user.id,
            refresh_token=refresh_token,
            expires_at=refresh_expires_at,
        )

        await db.commit()

    except Exception:
        await db.rollback()
        raise

    # --------------------------------------------------------
    # Set secure authentication cookies
    # --------------------------------------------------------

    set_auth_cookies(
        response=response,
        access_token=access_token,
        refresh_token=refresh_token,
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=(
            settings.ACCESS_TOKEN_EXPIRE_MINUTES
            * 60
        ),
    )


# ============================================================
# REFRESH TOKEN ROTATION
# ============================================================

@router.post(
    "/refresh",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
)
@limiter.limit("10/minute")
async def refresh_access_token(
    request: Request,
    data: RefreshTokenRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    """
    Rotate a refresh token.

    Flow:

        Client sends refresh token
                ↓
        Validate JWT
                ↓
        Hash raw token
                ↓
        Find DB record
                ↓
        Check revoked/expired
                ↓
        Revoke old token
                ↓
        Create new access token
                ↓
        Create new refresh token
                ↓
        Store new refresh-token hash
                ↓
        Link old token -> new token
                ↓
        Set new authentication cookies
                ↓
        Return new token pair

    Rate limit:
        10 requests per minute per IP.
    """

    # --------------------------------------------------------
    # 1. Decode and validate JWT
    # --------------------------------------------------------

    try:
        payload = decode_token(
            data.refresh_token
        )

    except jwt.InvalidTokenError:
        raise authentication_error()

    # --------------------------------------------------------
    # 2. Make sure this is a refresh token
    # --------------------------------------------------------

    if payload.get("type") != "refresh":
        raise authentication_error(
            "Invalid refresh token"
        )

    # --------------------------------------------------------
    # 3. Extract user ID
    # --------------------------------------------------------

    subject = payload.get("sub")

    if subject is None:
        raise authentication_error(
            "Invalid refresh token payload"
        )

    try:
        user_id = int(subject)

    except (
        TypeError,
        ValueError,
    ):
        raise authentication_error(
            "Invalid refresh token subject"
        )

    if user_id <= 0:
        raise authentication_error(
            "Invalid refresh token subject"
        )

    # --------------------------------------------------------
    # 4. Verify user still exists
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

    # --------------------------------------------------------
    # 5. Hash presented refresh token
    # --------------------------------------------------------

    token_hash = hash_refresh_token(
        data.refresh_token
    )

    # --------------------------------------------------------
    # 6. Find token and lock row
    #
    # FOR UPDATE prevents two simultaneous refresh
    # requests from successfully rotating the same token.
    # --------------------------------------------------------

    result = await db.execute(
        select(RefreshToken)
        .where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.user_id == user.id,
        )
        .with_for_update()
    )

    stored_token = (
        result.scalar_one_or_none()
    )

    if stored_token is None:
        raise authentication_error(
            "Refresh token has been revoked or is invalid"
        )

    # --------------------------------------------------------
    # 7. Detect refresh-token reuse
    # --------------------------------------------------------

    if stored_token.revoked_at is not None:
        """
        A refresh token that was already revoked is being
        presented again.

        This strongly indicates token reuse/theft.

        Revoke all currently active refresh tokens belonging
        to this user so the attacker cannot continue rotating
        tokens.
        """

        active_tokens_result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.user_id == user.id,
                RefreshToken.revoked_at.is_(None),
            )
        )

        active_tokens = (
            active_tokens_result.scalars().all()
        )

        now = datetime.now(timezone.utc)

        for active_token in active_tokens:
            active_token.revoked_at = now

        await db.commit()

        raise authentication_error(
            "Refresh token reuse detected. "
            "Please sign in again."
        )

    # --------------------------------------------------------
    # 8. Check database expiration
    # --------------------------------------------------------

    now = datetime.now(timezone.utc)

    expires_at = stored_token.expires_at

    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(
            tzinfo=timezone.utc
        )

    if expires_at <= now:
        stored_token.revoked_at = now

        await db.commit()

        raise authentication_error(
            "Refresh token has expired"
        )

    # --------------------------------------------------------
    # 9. Create new token pair
    # --------------------------------------------------------

    new_access_token = create_access_token(
        str(user.id)
    )

    new_refresh_token = create_refresh_token(
        str(user.id)
    )

    new_refresh_expires_at = (
        get_refresh_token_expiration(
            new_refresh_token
        )
    )

    # --------------------------------------------------------
    # 10. Revoke old refresh token
    # --------------------------------------------------------

    stored_token.revoked_at = now

    # --------------------------------------------------------
    # 11. Store new refresh token
    # --------------------------------------------------------

    new_token_record = await store_refresh_token(
        db=db,
        user_id=user.id,
        refresh_token=new_refresh_token,
        expires_at=new_refresh_expires_at,
    )

    # --------------------------------------------------------
    # 12. Link old token to replacement
    # --------------------------------------------------------

    stored_token.replaced_by_token_id = (
        new_token_record.id
    )

    # --------------------------------------------------------
    # 13. Commit rotation atomically
    # --------------------------------------------------------

    try:
        await db.commit()

    except Exception:
        await db.rollback()
        raise

    # --------------------------------------------------------
    # 14. Set new authentication cookies
    # --------------------------------------------------------

    set_auth_cookies(
        response=response,
        access_token=new_access_token,
        refresh_token=new_refresh_token,
    )

    # --------------------------------------------------------
    # 15. Return new token pair
    # --------------------------------------------------------

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=(
            settings.ACCESS_TOKEN_EXPIRE_MINUTES
            * 60
        ),
    )


# ============================================================
# CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
)
async def get_me(
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Return the currently authenticated user.
    """

    return current_user

