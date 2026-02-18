"""
Movie catalog: list and detail for UI (with poster URLs and filters).
"""
from fastapi import APIRouter, HTTPException, Query

from src.api.schemas.common import ApiResponse
from src.api.schemas.movies import MovieListItem, MovieDetail, MovieListResponse
from src.services.movie_catalog import get_catalog_df, get_movie_by_id, get_movies_page

router = APIRouter(prefix="/movies", tags=["Movies"])


@router.get(
    "",
    response_model=ApiResponse[MovieListResponse],
    summary="List movies",
    description="Paginated list with optional search and filters. Use for browse UI with posters.",
)
def list_movies(
    skip: int = Query(0, ge=0, description="Offset"),
    limit: int = Query(20, ge=1, le=100, description="Page size"),
    search: str | None = Query(None, description="Search in title and description"),
    mood: str | None = Query(None, description="Filter by mood"),
    genre: str | None = Query(None, description="Filter by genre / emotional tone"),
) -> ApiResponse[MovieListResponse]:
    items, total = get_movies_page(skip=skip, limit=limit, search=search, mood=mood, genre=genre)
    return ApiResponse(
        data=MovieListResponse(
            items=[MovieListItem(**x) for x in items],
            total=total,
            skip=skip,
            limit=limit,
        ),
        meta={"filters": {"search": search, "mood": mood, "genre": genre}},
    )


@router.get(
    "/{film_id}",
    response_model=ApiResponse[MovieDetail],
    summary="Get movie by ID",
    description="Full movie details including poster URL for detail page or modal.",
)
def get_movie(film_id: int) -> ApiResponse[MovieDetail]:
    movie = get_movie_by_id(film_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return ApiResponse(data=MovieDetail(**movie))
