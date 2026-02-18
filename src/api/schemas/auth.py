"""Auth-related request/response schemas."""
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Credentials for login."""

    username: str = Field(..., min_length=1, description="Username")
    password: str = Field(..., min_length=1, description="Password")


class RefreshRequest(BaseModel):
    """Refresh token body."""

    refresh_token: str = Field(..., description="JWT refresh token")


class UserOut(BaseModel):
    """Public user info returned in auth responses."""

    id: str = Field(..., description="User identifier")
    username: str = Field(..., description="Username")


class TokenPair(BaseModel):
    """Access and refresh tokens with user info."""

    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    user: UserOut = Field(..., description="Authenticated user")
