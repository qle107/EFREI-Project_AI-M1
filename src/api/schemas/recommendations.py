"""Recommendation request/response schemas."""
from typing import Optional
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
                    "preferred_era": "2010s",
                    "preferred_director": "Denis Villeneuve",
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
    preferred_era: Optional[str] = Field(
        None,
        description="Preferred time period for movies. Examples: 'Classic (pre-1980)', '80s', '90s', '2000s', '2010s', 'Recent (2020+)'.",
        examples=["2010s", "90s", "Recent (2020+)"],
    )
    preferred_director: Optional[str] = Field(
        None,
        description="Preferred director or filmmaking style reference. Free text, e.g. 'Christopher Nolan', 'Wes Anderson'.",
        examples=["Christopher Nolan", "Denis Villeneuve"],
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
    cinephile_profile: Optional[str] = Field(None, description="AI-generated short cinephile profile of the user")
    description_enriched: bool = Field(False, description="True if the user description was too short and was enriched by GenAI")
    cached: bool = Field(False, description="True if the GenAI explanation was served from cache")
    preset_id: Optional[str] = Field(None, description="Preset query ID if this was a preset request")
    llm_provider: Optional[str] = Field(None, description="LLM used for the explanation: ollama or anthropic")


class PresetQueryItem(BaseModel):
    """A predefined recommendation query users can select for instant results."""

    id: str = Field(..., description="Unique preset identifier")
    label: str = Field(..., description="Human-readable label for the UI")
    description: str = Field(..., description="The free-text description used")
    preferred_mood: str
    preferred_genre: str
    preferred_style: str
    mood_intensity: int
    theme_interest: int
    style_interest: int


class HistoryEntrySummary(BaseModel):
    """One row in the recommendation history list."""

    id: int = Field(..., description="History entry ID")
    created_at: str = Field(..., description="ISO timestamp")
    summary: str = Field(..., description="Short summary (description snippet or preset name)")


class HistoryEntryDetail(BaseModel):
    """Full history entry for viewing a past recommendation."""

    id: int = Field(..., description="History entry ID")
    user_id: str = Field(..., description="User who ran the recommendation")
    created_at: str = Field(..., description="ISO timestamp")
    request: dict = Field(..., description="Request payload (description, mood, genre, etc.)")
    response: dict = Field(..., description="Full response (recommendations, explanation, etc.)")
