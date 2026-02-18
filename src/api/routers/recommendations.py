"""
Movie recommendations: semantic AISCA pipeline.
"""
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends

from src.api.schemas.common import ApiResponse
from src.api.schemas.recommendations import (
    RecommendationRequest,
    RecommendationResponse,
)
from src.api.dependencies import (
    get_current_user,
    get_encoder,
    get_scorer,
    get_llm_client,
    _top3_to_items,
)
from src.api.schemas.auth import UserOut
from src.user_profile.questionnaire_schema import UserQuestionnaire
from src.recommendation.recommender import RecommendationEngine
from src.genAi.prompt_builder import build_aisca_prompt

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post(
    "",
    response_model=ApiResponse[RecommendationResponse],
    summary="Get movie recommendations",
    description=(
        "Submit your preferences via the questionnaire body. Returns top 3 movies with "
        "semantic coverage scores and an AI-generated explanation. Requires authentication.\n\n"
        "**Request body guide:**\n"
        "- **description**: Free text; be specific (tone, themes, what to avoid). Used heavily for matching.\n"
        "- **preferred_mood** / **preferred_genre** / **preferred_style**: Use values from `GET /api/v1/catalog/options` for best results (e.g. mood: `dark`, `tense`, `uplifting`; genre: `crime`, `science fiction`; style: `mystery`, `action`, `drama`). Single keyword or short phrase.\n"
        "- **mood_intensity** (1–5): 1 = subtle mood, 5 = mood is central.\n"
        "- **theme_interest** (1–5): 1 = theme secondary, 5 = theme very important.\n"
        "- **style_interest** (1–5): 1 = pacing matters little, 5 = pacing/style very important."
    ),
)
def get_recommendations(
    body: RecommendationRequest,
    current_user: Annotated[UserOut, Depends(get_current_user)],
    encoder=Depends(get_encoder),
    scorer=Depends(get_scorer),
    llm_client=Depends(get_llm_client),
) -> ApiResponse[RecommendationResponse]:
    # 1) Encode user profile
    questionnaire = UserQuestionnaire(
        description=body.description,
        preferred_mood=body.preferred_mood,
        preferred_genre=body.preferred_genre,
        preferred_style=body.preferred_style,
        mood_intensity=body.mood_intensity,
        theme_interest=body.theme_interest,
        style_interest=body.style_interest,
    )
    user_profile = encoder.encode_profile(questionnaire)

    # 2) Compute coverage scores (returns top-3 scored dataframe)
    scored_movies = scorer.compute_score(user_profile)

    # 3) Format top 3
    engine = RecommendationEngine(scored_movies)
    top3 = engine.get_top3()

    # 4) GenAI explanation (optional: if Ollama model missing, still return recommendations)
    prompt = build_aisca_prompt(questionnaire, top3)
    try:
        explanation = llm_client.generate(prompt)
    except RuntimeError:
        explanation = (
            "Explanation unavailable: Ollama model not found or LLM error. "
            "Install the default model with `ollama pull phi3:mini` or set LLM_MODEL in .env to a model you have (e.g. llama3.2)."
        )

    # 5) Response
    items = _top3_to_items(top3)
    return ApiResponse(
        data=RecommendationResponse(
            recommendations=items,
            explanation=explanation,
        ),
        meta={
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": current_user.id,
        },
    )
