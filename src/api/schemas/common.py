"""Shared response envelopes and common schemas."""
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Standard success envelope for API responses."""

    data: T
    meta: dict[str, Any] = Field(default_factory=dict, description="Optional metadata (e.g. request_id, timestamp)")


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(..., description="Service status")
    version: str = Field(..., description="API version")
