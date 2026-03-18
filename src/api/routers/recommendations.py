"""
Movie recommendations: semantic AISCA pipeline.

Supports both custom queries and preset queries (pre-cached for instant results).
"""
import logging
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from src.api.schemas.common import ApiResponse
from src.api.schemas.recommendations import (
    RecommendationRequest,
    RecommendationResponse,
    ScoreWeights,
    PresetQueryItem,
    HistoryEntrySummary,
    HistoryEntryDetail,
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
from src.genAi.prompt_builder import build_aisca_prompt, build_enrichment_prompt
from src.genAi.preset_queries import PRESET_QUERIES, get_preset_by_id
from src.core.llm_runtime_config import get_llm_runtime
from src.core.recommendation_history import save as save_history, list_by_user as list_history, get_by_id as get_history_by_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

_ENRICHMENT_WORD_THRESHOLD = 5


def _parse_cinephile_profile(raw_text: str) -> tuple[str, str | None]:
    """Split LLM output into (explanation, cinephile_profile)."""
    marker = "CINEPHILE_PROFILE:"
    idx = raw_text.find(marker)
    if idx == -1:
        return raw_text.strip(), None
    explanation = raw_text[:idx].strip()
    profile = raw_text[idx + len(marker):].strip()
    return explanation, profile or None


def _field(body, key):
    """Read a field from either a Pydantic model or a plain dict."""
    if isinstance(body, dict):
        return body.get(key)
    return getattr(body, key, None)


def _build_llm_error_message(provider: str, err: Exception) -> str:
    """Return a user-facing message while preserving actionable provider errors."""
    err_text = str(err).strip()
    err_lower = err_text.lower()

    # Keep timeout details: they already include concrete next steps.
    if "timed out" in err_lower or "took longer" in err_lower:
        return err_text

    # Keep explicit missing-key/setup guidance from provider clients.
    if "api key is not set" in err_lower:
        return err_text

    # Keep actionable Ollama connectivity/model errors.
    if provider == "ollama" and (
        "connection refused" in err_lower
        or "failed to establish a new connection" in err_lower
        or "name or service not known" in err_lower
        or "not found" in err_lower
    ):
        return (
            "Ollama request failed. Ensure Ollama is running "
            "(e.g. `ollama run phi3:mini`) and your model is available."
        )

    return (
        "Explanation unavailable: LLM error. "
        "For Ollama, ensure it is running (e.g. ollama run phi3:mini). "
        "For Claude or Gemini, set the API key in .env or in Settings and choose that provider."
    )


def _run_pipeline(
    body, encoder, scorer, llm_client, preset_id: str | None = None,
) -> RecommendationResponse:
    """Shared pipeline logic for both custom and preset requests."""
    description_text = _field(body, "description")
    description_enriched = False

    runtime = get_llm_runtime()
    provider = runtime.get("provider", "ollama")
    logger.info("Recommendation pipeline started (provider=%s, preset_id=%s)", provider, preset_id)

    word_count = len(description_text.split())
    if word_count < _ENRICHMENT_WORD_THRESHOLD:
        try:
            enrichment_prompt = build_enrichment_prompt(description_text)
            logger.debug("Calling LLM for description enrichment (provider=%s)", provider)
            enriched = llm_client.generate(enrichment_prompt)
            if enriched and len(enriched.split()) > word_count:
                logger.info("Description enriched by GenAI: %r -> %r", description_text, enriched)
                description_text = enriched.strip()
                description_enriched = True
        except RuntimeError as e:
            logger.warning("GenAI enrichment failed; using original description. Error: %s", e, exc_info=True)

    questionnaire = UserQuestionnaire(
        description=description_text,
        preferred_mood=_field(body, "preferred_mood"),
        preferred_genre=_field(body, "preferred_genre"),
        preferred_style=_field(body, "preferred_style"),
        preferred_era=_field(body, "preferred_era"),
        preferred_director=_field(body, "preferred_director"),
        mood_intensity=_field(body, "mood_intensity"),
        theme_interest=_field(body, "theme_interest"),
        style_interest=_field(body, "style_interest"),
    )
    user_profile = encoder.encode_profile(questionnaire)

    scored_movies = scorer.compute_score(user_profile, questionnaire)
    score_weights = scorer.compute_axis_weights(questionnaire)

    engine = RecommendationEngine(scored_movies)
    top3 = engine.get_top3()

    prompt = build_aisca_prompt(questionnaire, top3)

    cache_before = llm_client.cache_size
    cinephile_profile = None
    try:
        logger.info("Calling LLM for explanation (provider=%s)", provider)
        raw_output = llm_client.generate(prompt)
        explanation, cinephile_profile = _parse_cinephile_profile(raw_output)
        logger.info("LLM explanation received (provider=%s, len=%d)", provider, len(explanation or ""))
    except RuntimeError as e:
        logger.warning(
            "LLM generate failed (provider=%s): %s",
            provider,
            e,
            exc_info=True,
        )
        explanation = _build_llm_error_message(provider, e)

    was_cached = llm_client.cache_size == cache_before
    llm_provider = get_llm_runtime().get("provider", "ollama")

    items = _top3_to_items(top3)
    return RecommendationResponse(
        recommendations=items,
        explanation=explanation,
        cinephile_profile=cinephile_profile,
        description_enriched=description_enriched,
        cached=was_cached,
        preset_id=preset_id,
        llm_provider=llm_provider,
        score_weights=ScoreWeights(
            mood=score_weights["mood"],
            theme=score_weights["theme"],
            style=score_weights["style"],
            description=score_weights["description"],
            recency=score_weights["recency"],
        ),
    )


# ---------- Endpoints ----------


@router.get(
    "/presets",
    response_model=ApiResponse[list[PresetQueryItem]],
    summary="List preset recommendation queries",
    description=(
        "Returns predefined queries that can be selected for instant (cached) results. "
        "Use the preset `id` with `POST /recommendations/presets/{preset_id}` to get recommendations."
    ),
)
def list_presets() -> ApiResponse[list[PresetQueryItem]]:
    items = [
        PresetQueryItem(
            id=p["id"],
            label=p["label"],
            description=p["description"],
            preferred_mood=p["preferred_mood"],
            preferred_genre=p["preferred_genre"],
            preferred_style=p["preferred_style"],
            mood_intensity=p["mood_intensity"],
            theme_interest=p["theme_interest"],
            style_interest=p["style_interest"],
        )
        for p in PRESET_QUERIES
    ]
    return ApiResponse(
        data=items,
        meta={"count": len(items)},
    )


@router.post(
    "/presets/{preset_id}",
    response_model=ApiResponse[RecommendationResponse],
    summary="Get recommendations from a preset query",
    description=(
        "Run a predefined query by its ID. The first call runs the full pipeline and "
        "caches the result; subsequent calls return instantly from cache. "
        "Requires authentication."
    ),
)
def get_preset_recommendations(
    preset_id: str,
    current_user: Annotated[UserOut, Depends(get_current_user)],
    encoder=Depends(get_encoder),
    scorer=Depends(get_scorer),
    llm_client=Depends(get_llm_client),
) -> ApiResponse[RecommendationResponse]:
    preset = get_preset_by_id(preset_id)
    if preset is None:
        raise HTTPException(status_code=404, detail=f"Preset '{preset_id}' not found")

    result = _run_pipeline(preset, encoder, scorer, llm_client, preset_id=preset_id)
    try:
        save_history(
            current_user.id,
            {k: v for k, v in preset.items() if k != "id" and k != "label"},
            result.model_dump(),
        )
    except Exception as e:
        logger.warning("Failed to save recommendation history: %s", e)
    return ApiResponse(
        data=result,
        meta={
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": current_user.id,
            "preset_id": preset_id,
        },
    )


@router.post(
    "",
    response_model=ApiResponse[RecommendationResponse],
    summary="Get movie recommendations",
    description=(
        "Submit your preferences via the questionnaire body. Returns top 3 movies with "
        "semantic coverage scores and an AI-generated explanation. Requires authentication.\n\n"
        "**Request body guide:**\n"
        "- **description**: Free text; be specific (tone, themes, what to avoid). Used heavily for matching.\n"
        "- **preferred_mood** / **preferred_genre** / **preferred_style**: Use values from `GET /api/v1/catalog/options` for best results.\n"
        "- **preferred_era**: Optional. e.g. '2010s', '90s', 'Recent (2020+)'.\n"
        "- **preferred_director**: Optional. e.g. 'Christopher Nolan'.\n"
        "- **mood_intensity** (1-5): 1 = subtle mood, 5 = mood is central.\n"
        "- **theme_interest** (1-5): 1 = theme secondary, 5 = theme very important.\n"
        "- **style_interest** (1-5): 1 = pacing matters little, 5 = pacing/style very important.\n\n"
        "If the description is very short (< 5 words), GenAI will enrich it before embedding.\n\n"
        "**Caching**: Identical requests are cached for fast responses (req 1.5.3).\n"
        "**Presets**: Use `GET /presets` and `POST /presets/{id}` for instant pre-defined queries."
    ),
)
def get_recommendations(
    body: RecommendationRequest,
    current_user: Annotated[UserOut, Depends(get_current_user)],
    encoder=Depends(get_encoder),
    scorer=Depends(get_scorer),
    llm_client=Depends(get_llm_client),
) -> ApiResponse[RecommendationResponse]:
    result = _run_pipeline(body, encoder, scorer, llm_client)
    try:
        save_history(current_user.id, body.model_dump(), result.model_dump())
    except Exception as e:
        logger.warning("Failed to save recommendation history: %s", e)
    return ApiResponse(
        data=result,
        meta={
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "user_id": current_user.id,
        },
    )


@router.get(
    "/history",
    response_model=ApiResponse[list[HistoryEntrySummary]],
    summary="List recommendation history",
    description="Returns the current user's past recommendation generations (newest first). Requires authentication.",
)
def list_recommendation_history(
    current_user: Annotated[UserOut, Depends(get_current_user)],
    limit: int = 50,
) -> ApiResponse[list[HistoryEntrySummary]]:
    entries = list_history(current_user.id, limit=limit)
    items = [HistoryEntrySummary(id=e["id"], created_at=e["created_at"], summary=e["summary"]) for e in entries]
    return ApiResponse(data=items, meta={"count": len(items)})


@router.get(
    "/history/{history_id}",
    response_model=ApiResponse[HistoryEntryDetail],
    summary="Get one recommendation history entry",
    description="Returns full request and response for a past generation. Requires authentication.",
)
def get_recommendation_history_entry(
    history_id: int,
    current_user: Annotated[UserOut, Depends(get_current_user)],
) -> ApiResponse[HistoryEntryDetail]:
    entry = get_history_by_id(current_user.id, history_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="History entry not found")
    return ApiResponse(
        data=HistoryEntryDetail(
            id=entry["id"],
            user_id=entry["user_id"],
            created_at=entry["created_at"],
            request=entry["request"],
            response=entry["response"],
        ),
    )
