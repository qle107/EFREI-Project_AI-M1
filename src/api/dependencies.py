"""
FastAPI dependencies: auth, service singletons.
Heavy components (encoder, scorer, LLM) are lazy-loaded on first use.
"""
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.core.security import decode_token
from src.api.schemas.auth import UserOut
from src.api.schemas.recommendations import MovieRecommendationItem

# HTTPBearer for protected routes
bearer_scheme = HTTPBearer(auto_error=False)

# Lazy singletons (avoid loading sentence_transformers etc. at app import)
_encoder = None
_scorer = None
_llm_client = None


def get_encoder():
    global _encoder
    if _encoder is None:
        from src.user_profile.profile_encoder import UserProfileEncoder
        _encoder = UserProfileEncoder()
    return _encoder


def get_scorer():
    global _scorer
    if _scorer is None:
        from src.scoring.coverage_scorer import CoverageScorer
        _scorer = CoverageScorer()
    return _scorer


def get_llm_client():
    global _llm_client
    if _llm_client is None:
        from src.genAi.llm_client import LLMClient
        _llm_client = LLMClient()
    return _llm_client


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)]
) -> UserOut:
    """Validate JWT and return current user. Use on protected routes."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    sub = payload.get("sub")
    username = payload.get("username", sub)
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return UserOut(id=sub, username=username)


def _top3_to_items(top3: list[dict]) -> list[MovieRecommendationItem]:
    """Map recommender output to schema, including poster_url from catalog."""
    from src.services.movie_catalog import get_poster_url_for_film_id
    return [
        MovieRecommendationItem(
            film_id=item["FilmID"],
            title=item["Title"],
            poster_url=get_poster_url_for_film_id(item["FilmID"]),
            coverage_score=item["CoverageScore"],
            mood_score=item["MoodScore"],
            theme_score=item["ThemeScore"],
            style_score=item["StyleScore"],
            desc_score=item["DescScore"],
        )
        for item in top3
    ]
