"""Recommendation request/response schemas."""
from pydantic import BaseModel, ConfigDict, Field


class RecommendationRequest(BaseModel):
    """
    User preferences for movie recommendations (questionnaire).

    **Where to get valid options:** Call `GET /api/v1/catalog/options` to get
    the list of `moods`, `genres`, and `styles` used in the catalog. Using
    those values (or close variants) gives the best semantic match.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "examples": [
                {
                    "description": "I want a slow-burn sci-fi thriller with a mysterious vibe, ethical dilemmas about AI, and a tense atmosphere. Minimal romance, smart dialogue, and a satisfying twist.",
                    "preferred_mood": "tense",
                    "preferred_genre": "science fiction",
                    "preferred_style": "mystery",
                    "mood_intensity": 5,
                    "theme_interest": 4,
                    "style_interest": 4,
                },
                {
                    "description": "Dark emotional story with mystery and corruption.",
                    "preferred_mood": "dark",
                    "preferred_genre": "crime",
                    "preferred_style": "drama",
                    "mood_intensity": 5,
                    "theme_interest": 4,
                    "style_interest": 3,
                },
            ]
        }
    )

    description: str = Field(
        ...,
        description="Free-text description of what you want. Be specific: tone, themes, pacing, what to avoid (e.g. 'no romance', 'smart dialogue'). This is weighted heavily in the semantic match.",
        min_length=10,
        examples=["I want a slow-burn sci-fi thriller with ethical dilemmas about AI and a tense atmosphere. Minimal romance, smart dialogue, satisfying twist."],
    )
    preferred_mood: str = Field(
        ...,
        description="Mood or atmosphere you want. Use values from GET /api/v1/catalog/options (moods). Examples: dark, uplifting, tense, heroic. Single value or comma-separated (e.g. 'dark, tense').",
        examples=["tense", "dark", "uplifting"],
    )
    preferred_genre: str = Field(
        ...,
        description="Genre or theme you want. Use values from GET /api/v1/catalog/options (genres). Examples: crime, fantasy, science fiction, thriller, drama.",
        examples=["science fiction", "crime", "fantasy"],
    )
    preferred_style: str = Field(
        ...,
        description="Narrative style or pacing. Use values from GET /api/v1/catalog/options (styles). Examples: action, mystery, drama. Avoid long phrases; one or two keywords work best.",
        examples=["mystery", "action", "drama"],
    )
    mood_intensity: int = Field(
        ...,
        ge=1,
        le=5,
        description="How strong you want the mood to be. 1 = subtle background mood, 5 = mood is central and very pronounced.",
    )
    theme_interest: int = Field(
        ...,
        ge=1,
        le=5,
        description="How important the theme/genre is to you. 1 = theme is secondary, 5 = theme is very important and should drive the match.",
    )
    style_interest: int = Field(
        ...,
        ge=1,
        le=5,
        description="How important pacing and narrative style are. 1 = style matters little, 5 = pacing and style are very important.",
    )


class MovieRecommendationItem(BaseModel):
    """Single movie in the recommendation list (with optional poster for UI)."""

    film_id: int = Field(..., description="Movie ID for linking to detail")
    title: str = Field(..., description="Movie title")
    poster_url: str | None = Field(None, description="Poster image URL for UI")
    coverage_score: float = Field(..., description="Overall semantic coverage score")
    mood_score: float = Field(..., description="Mood match score")
    theme_score: float = Field(..., description="Theme match score")
    style_score: float = Field(..., description="Style match score")
    desc_score: float = Field(..., description="Description match score")


class RecommendationResponse(BaseModel):
    """Payload returned by the recommendations endpoint (wrapped in ApiResponse.data)."""

    recommendations: list[MovieRecommendationItem] = Field(..., description="Top 3 recommended movies")
    explanation: str = Field(..., description="AI-generated explanation of why these movies match")
