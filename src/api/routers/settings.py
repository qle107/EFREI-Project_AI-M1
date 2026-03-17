"""
Settings API: LLM configuration (editable from the frontend settings page).
"""
import logging
from typing import Annotated

from fastapi import APIRouter, Depends

from src.api.schemas.common import ApiResponse

logger = logging.getLogger(__name__)
from src.api.schemas.settings import LLMSettingsOut, LLMSettingsUpdate
from src.api.dependencies import get_current_user, get_llm_client, reset_llm_client
from src.api.schemas.auth import UserOut
from src.core.llm_runtime_config import (
    get_llm_runtime,
    update_llm_runtime,
    get_anthropic_configured,
    get_gemini_configured,
)

router = APIRouter(prefix="/settings", tags=["Settings"])


def _runtime_to_settings_out(runtime: dict, cache_size: int) -> LLMSettingsOut:
    return LLMSettingsOut(
        provider=runtime.get("provider", "ollama"),
        llm_url=runtime["llm_url"],
        llm_model=runtime["llm_model"],
        num_predict=runtime["num_predict"],
        temperature=runtime["temperature"],
        cache_ttl=runtime["cache_ttl"],
        cache_max_size=runtime["cache_max_size"],
        cache_size=cache_size,
        anthropic_model=runtime.get("anthropic_model", "claude-3-5-haiku-20241022"),
        anthropic_max_tokens=runtime.get("anthropic_max_tokens", 512),
        anthropic_configured=get_anthropic_configured(),
        gemini_model=runtime.get("gemini_model", "gemini-1.5-flash"),
        gemini_max_tokens=runtime.get("gemini_max_tokens", 512),
        gemini_configured=get_gemini_configured(),
    )


@router.get(
    "/llm",
    response_model=ApiResponse[LLMSettingsOut],
    summary="Get LLM settings",
    description="Returns current LLM configuration (provider, URL, model, temperature, cache, etc.). API key is never returned.",
)
def get_llm_settings(
    current_user: Annotated[UserOut, Depends(get_current_user)],
    llm_client=Depends(get_llm_client),
) -> ApiResponse[LLMSettingsOut]:
    runtime = get_llm_runtime()
    data = _runtime_to_settings_out(runtime, llm_client.cache_size)
    return ApiResponse(data=data, meta={"user_id": current_user.id})


@router.put(
    "/llm",
    response_model=ApiResponse[LLMSettingsOut],
    summary="Update LLM settings",
    description="Update LLM configuration. The LLM client is recreated with the new settings.",
)
def update_llm_settings(
    body: LLMSettingsUpdate,
    current_user: Annotated[UserOut, Depends(get_current_user)],
) -> ApiResponse[LLMSettingsOut]:
    updates = body.model_dump(exclude_unset=True)
    logger.info("LLM settings update requested by user_id=%s, keys=%s", current_user.id, list(updates.keys()))
    runtime = update_llm_runtime(updates)
    reset_llm_client()
    llm_client = get_llm_client()
    data = _runtime_to_settings_out(runtime, llm_client.cache_size)
    logger.info("LLM switched successfully for user_id=%s → provider=%s", current_user.id, runtime.get("provider"))
    return ApiResponse(data=data, meta={"user_id": current_user.id})


@router.post(
    "/llm/clear-cache",
    response_model=ApiResponse[dict],
    summary="Clear LLM response cache",
    description="Empties the in-memory cache of prompt/response pairs. Next identical request will call the selected LLM (Ollama, Claude, or Gemini) again.",
)
def clear_llm_cache(
    current_user: Annotated[UserOut, Depends(get_current_user)],
    llm_client=Depends(get_llm_client),
) -> ApiResponse[dict]:
    size_before = llm_client.cache_size
    llm_client.cache.clear()
    return ApiResponse(
        data={"cleared": True, "entries_removed": size_before},
        meta={"user_id": current_user.id},
    )
