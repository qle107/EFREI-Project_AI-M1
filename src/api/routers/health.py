"""
Health and readiness.
"""
from fastapi import APIRouter

from src.api.schemas.common import HealthResponse
from src.core.config import API_VERSION

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Returns API status and version. Use for load balancers and monitoring.",
)
def health() -> HealthResponse:
    return HealthResponse(status="ok", version=API_VERSION)
