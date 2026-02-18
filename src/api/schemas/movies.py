"""Movie catalog and detail schemas."""
from pydantic import BaseModel, Field


class MovieListItem(BaseModel):
    """Movie in list/browse responses."""

    film_id: int = Field(..., description="Unique movie ID")
    title: str = Field(..., description="Movie title")
    mood: str = Field(..., description="Mood tag(s)")
    theme: str = Field(..., description="Theme tag(s)")
    narrative_style: str = Field(..., description="Narrative style tag(s)")
    emotional_tone: str = Field(..., description="Genre / emotional tone")
    poster_url: str | None = Field(None, description="TMDB poster image URL")
    vote_average: float | None = Field(None, description="Average rating if available")


class MovieDetail(BaseModel):
    """Full movie details for detail page or modal."""

    film_id: int = Field(..., description="Unique movie ID")
    title: str = Field(..., description="Movie title")
    mood: str = Field(..., description="Mood tag(s)")
    theme: str = Field(..., description="Theme tag(s)")
    narrative_style: str = Field(..., description="Narrative style tag(s)")
    emotional_tone: str = Field(..., description="Genre / emotional tone")
    description: str = Field(..., description="Full semantic description")
    overview: str = Field(..., description="Short plot overview")
    poster_url: str | None = Field(None, description="TMDB poster image URL")
    release_date: str | None = Field(None, description="Release date")
    vote_average: float | None = Field(None, description="Average rating if available")


class MovieListResponse(BaseModel):
    """Paginated movie list."""

    items: list[MovieListItem] = Field(..., description="Page of movies")
    total: int = Field(..., description="Total count for current filters")
    skip: int = Field(..., description="Offset applied")
    limit: int = Field(..., description="Page size")


class CatalogOptions(BaseModel):
    """Options for UI dropdowns (moods, genres, styles)."""

    moods: list[str] = Field(..., description="Available mood options")
    genres: list[str] = Field(..., description="Available theme/genre options")
    styles: list[str] = Field(..., description="Available narrative style options")
