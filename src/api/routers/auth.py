"""
Authentication: login, refresh, me.
"""
from fastapi import APIRouter, HTTPException, status

from src.api.schemas.auth import LoginRequest, TokenPair, UserOut, RefreshRequest
from src.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
)
from src.core.auth_user import get_user_by_credentials
from src.api.dependencies import get_current_user
from typing import Annotated
from fastapi import Depends

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/login",
    response_model=TokenPair,
    summary="Login",
    description="Authenticate with username and password. Returns access and refresh tokens.",
)
def login(credentials: LoginRequest) -> TokenPair:
    user = get_user_by_credentials(credentials.username, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    access_token = create_access_token(
        user.id,
        extra_claims={"username": user.username},
    )
    refresh_token = create_refresh_token(user.id)
    return TokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user,
    )


@router.post(
    "/refresh",
    response_model=TokenPair,
    summary="Refresh tokens",
    description="Exchange a valid refresh token for a new access and refresh token pair.",
)
def refresh(body: RefreshRequest) -> TokenPair:
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    # For demo we don't store username in refresh token; use id as username display
    user = UserOut(id=sub, username=sub)
    access_token = create_access_token(sub, extra_claims={"username": user.username})
    new_refresh = create_refresh_token(sub)
    return TokenPair(
        access_token=access_token,
        refresh_token=new_refresh,
        token_type="bearer",
        user=user,
    )


@router.get(
    "/me",
    response_model=UserOut,
    summary="Current user",
    description="Return the currently authenticated user (requires Bearer token).",
)
def me(current_user: Annotated[UserOut, Depends(get_current_user)]) -> UserOut:
    return current_user
