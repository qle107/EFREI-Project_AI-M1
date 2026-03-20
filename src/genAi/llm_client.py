"""
LLM client with in-memory response cache.

Supports Ollama (local), Anthropic Claude, and Google Gemini. Caching satisfies
Annexe I req 1.5.3 (responsible, cost-aware GenAI usage).
"""
import hashlib
import logging
import time
from threading import Lock
from typing import Any, TypedDict

import requests

from src.core.config import (
    LLM_URL,
    LLM_MODEL,
    LLM_NUM_PREDICT,
    LLM_TEMPERATURE,
    LLM_TIMEOUT,
    LLM_CACHE_TTL,
    LLM_CACHE_MAX_SIZE,
    LLM_PROVIDER,
    ANTHROPIC_API_KEY,
    ANTHROPIC_MODEL,
    ANTHROPIC_MAX_TOKENS,
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GEMINI_MAX_TOKENS,
)

logger = logging.getLogger(__name__)

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"
GEMINI_FALLBACK_MODEL = "gemini-2.0-flash"


def _gemini_http_error_message(response: requests.Response) -> str:
    """Extract a short message from Gemini REST error JSON or raw body."""
    try:
        data = response.json()
        err = data.get("error") if isinstance(data, dict) else None
        if isinstance(err, dict):
            msg = (err.get("message") or "").strip()
            status = (err.get("status") or "").strip()
            if msg and status:
                return f"{status}: {msg}"
            if msg:
                return msg
    except (ValueError, TypeError):
        pass
    text = (response.text or "").strip()
    return text[:600] if text else f"HTTP {response.status_code}"


def _gemini_generate_content(
    model: str,
    api_key: str,
    prompt: str,
    max_tokens: int,
    temperature: float,
    timeout: int,
) -> requests.Response:
    """Single Gemini generateContent call for one model ID."""
    url = f"{GEMINI_API_BASE}/{model}:generateContent?key={api_key}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": temperature,
        },
    }
    return requests.post(url, json=payload, timeout=timeout)


def _default_config() -> dict[str, Any]:
    return {
        "provider": LLM_PROVIDER,
        "url": LLM_URL,
        "model": LLM_MODEL,
        "num_predict": LLM_NUM_PREDICT,
        "temperature": LLM_TEMPERATURE,
        "timeout": LLM_TIMEOUT,
        "cache_ttl": LLM_CACHE_TTL,
        "cache_max_size": LLM_CACHE_MAX_SIZE,
        "anthropic_model": ANTHROPIC_MODEL,
        "anthropic_max_tokens": ANTHROPIC_MAX_TOKENS,
        "gemini_model": GEMINI_MODEL,
        "gemini_max_tokens": GEMINI_MAX_TOKENS,
    }


class _LLMRoute(TypedDict):
    """Per-request snapshot from runtime so all backends stay in sync with Settings / .env."""

    provider: str
    ollama_url: str
    ollama_model: str
    num_predict: int
    temperature: float
    timeout: int
    anthropic_model: str
    anthropic_max_tokens: int
    anthropic_api_key: str
    gemini_model: str
    gemini_max_tokens: int
    gemini_api_key: str


def _resolve_llm_route() -> _LLMRoute:
    from src.core.llm_runtime_config import get_llm_runtime_for_client

    rt = get_llm_runtime_for_client()
    p = str(rt.get("provider", "ollama")).strip().lower()
    if p not in ("ollama", "anthropic", "gemini"):
        p = "ollama"
    r: _LLMRoute = {
        "provider": p,
        "ollama_url": str(rt.get("llm_url") or LLM_URL),
        "ollama_model": str(rt.get("llm_model") or LLM_MODEL),
        "num_predict": int(rt.get("num_predict", LLM_NUM_PREDICT)),
        "temperature": float(rt.get("temperature", LLM_TEMPERATURE)),
        "timeout": int(rt.get("timeout", LLM_TIMEOUT)),
        "anthropic_model": str(rt.get("anthropic_model") or ANTHROPIC_MODEL),
        "anthropic_max_tokens": int(rt.get("anthropic_max_tokens", ANTHROPIC_MAX_TOKENS)),
        "anthropic_api_key": (str(rt.get("anthropic_api_key") or "").strip() or ANTHROPIC_API_KEY),
        "gemini_model": str(rt.get("gemini_model") or GEMINI_MODEL),
        "gemini_max_tokens": int(rt.get("gemini_max_tokens", GEMINI_MAX_TOKENS)),
        "gemini_api_key": (str(rt.get("gemini_api_key") or "").strip() or GEMINI_API_KEY),
    }
    return r


def _cache_route_segment(route: _LLMRoute) -> str:
    """Namespace cache entries per backend + model so Ollama/Gemini never share a hit."""
    return (
        f"{route['provider']}"
        f"|o={route['ollama_model']}"
        f"|a={route['anthropic_model']}"
        f"|g={route['gemini_model']}"
    )


class _PromptCache:
    """Thread-safe in-memory LRU-ish cache keyed by provider route + prompt SHA-256."""

    def __init__(self, ttl: int, max_size: int):
        self.ttl = ttl
        self.max_size = max_size
        self._store: dict[str, tuple[str, float]] = {}
        self._lock = Lock()

    @staticmethod
    def _key(prompt: str, route_segment: str) -> str:
        h = hashlib.sha256()
        h.update(route_segment.encode())
        h.update(b"\0")
        h.update(prompt.encode())
        return h.hexdigest()

    def get(self, prompt: str, route_segment: str) -> str | None:
        if self.ttl <= 0:
            return None
        key = self._key(prompt, route_segment)
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, ts = entry
            if time.time() - ts > self.ttl:
                del self._store[key]
                return None
            return value

    def put(self, prompt: str, route_segment: str, response: str) -> None:
        if self.ttl <= 0:
            return
        key = self._key(prompt, route_segment)
        with self._lock:
            if len(self._store) >= self.max_size and key not in self._store:
                oldest_key = min(self._store, key=lambda k: self._store[k][1])
                del self._store[oldest_key]
            self._store[key] = (response, time.time())

    def seed(self, prompt: str, response: str, route_segment: str = "seed|default") -> None:
        """Insert a pre-computed entry (for preset queries)."""
        self.put(prompt, route_segment, response)

    @property
    def size(self) -> int:
        with self._lock:
            return len(self._store)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()


class LLMClient:
    def __init__(
        self,
        url: str | None = None,
        model: str | None = None,
        config_overrides: dict[str, Any] | None = None,
    ):
        cfg = _default_config()
        if config_overrides:
            if "llm_url" in config_overrides:
                cfg["url"] = config_overrides["llm_url"]
            if "llm_model" in config_overrides:
                cfg["model"] = config_overrides["llm_model"]
            if "num_predict" in config_overrides:
                cfg["num_predict"] = config_overrides["num_predict"]
            if "temperature" in config_overrides:
                cfg["temperature"] = config_overrides["temperature"]
            if "cache_ttl" in config_overrides:
                cfg["cache_ttl"] = config_overrides["cache_ttl"]
            if "cache_max_size" in config_overrides:
                cfg["cache_max_size"] = config_overrides["cache_max_size"]
            if "timeout" in config_overrides:
                cfg["timeout"] = config_overrides["timeout"]
            if "provider" in config_overrides:
                cfg["provider"] = config_overrides["provider"]
            if "anthropic_model" in config_overrides:
                cfg["anthropic_model"] = config_overrides["anthropic_model"]
            if "anthropic_max_tokens" in config_overrides:
                cfg["anthropic_max_tokens"] = config_overrides["anthropic_max_tokens"]
            if "gemini_model" in config_overrides:
                cfg["gemini_model"] = config_overrides["gemini_model"]
            if "gemini_max_tokens" in config_overrides:
                cfg["gemini_max_tokens"] = config_overrides["gemini_max_tokens"]
        self._provider = (config_overrides or {}).get("provider") or cfg["provider"]
        self.url = url or cfg["url"]
        self.model = model or cfg["model"]
        self._num_predict = cfg["num_predict"]
        self._temperature = cfg["temperature"]
        self._timeout = int(cfg.get("timeout", LLM_TIMEOUT))
        self._anthropic_model = cfg.get("anthropic_model", ANTHROPIC_MODEL)
        self._anthropic_max_tokens = cfg.get("anthropic_max_tokens", ANTHROPIC_MAX_TOKENS)
        self._gemini_model = cfg.get("gemini_model", GEMINI_MODEL)
        self._gemini_max_tokens = cfg.get("gemini_max_tokens", GEMINI_MAX_TOKENS)
        # API keys: prefer runtime (set via Settings) over env
        self._anthropic_api_key = (config_overrides or {}).get("anthropic_api_key") or ANTHROPIC_API_KEY
        self._gemini_api_key = (config_overrides or {}).get("gemini_api_key") or GEMINI_API_KEY
        self.cache = _PromptCache(ttl=cfg["cache_ttl"], max_size=cfg["cache_max_size"])

    def generate(self, prompt: str) -> str:
        route = _resolve_llm_route()
        cache_seg = _cache_route_segment(route)
        logger.info("LLM generate() called — provider=%s", route["provider"])
        cached = self.cache.get(prompt, cache_seg)
        if cached is not None:
            logger.info("LLM cache HIT (cache size: %d)", self.cache.size)
            return cached

        if route["provider"] == "anthropic":
            logger.info("LLM cache MISS — calling Claude (%s)", route["anthropic_model"])
            response_text = self._call_anthropic(prompt, route)
        elif route["provider"] == "gemini":
            logger.info("LLM cache MISS — calling Gemini (%s)", route["gemini_model"])
            response_text = self._call_gemini(prompt, route)
        else:
            logger.info("LLM cache MISS — calling Ollama (%s)", route["ollama_model"])
            response_text = self._call_ollama(prompt, route)
        self.cache.put(prompt, cache_seg, response_text)
        return response_text

    def _call_ollama(self, prompt: str, route: _LLMRoute) -> str:
        payload = {
            "model": route["ollama_model"],
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": route["num_predict"],
                "temperature": route["temperature"],
            },
        }

        t0 = time.time()
        try:
            response = requests.post(route["ollama_url"], json=payload, timeout=route["timeout"])
        except requests.exceptions.Timeout:
            raise RuntimeError(
                f"Ollama took longer than {route['timeout']}s to respond. "
                "Try increasing LLM_TIMEOUT in .env or use a smaller model (e.g. phi3:mini)."
            )
        elapsed = time.time() - t0
        logger.info("Ollama responded in %.1fs", elapsed)

        if response.status_code != 200:
            logger.warning("Ollama API error status=%s body=%s", response.status_code, response.text[:500] if response.text else "")
            raise RuntimeError(response.text)

        return response.json()["response"]

    def _call_anthropic(self, prompt: str, route: _LLMRoute) -> str:
        api_key = (route["anthropic_api_key"] or "").strip()
        if not api_key:
            raise RuntimeError(
                "Claude API key is not set. Set ANTHROPIC_API_KEY in .env or enter it in Settings."
            )
        payload = {
            "model": route["anthropic_model"],
            "max_tokens": route["anthropic_max_tokens"],
            "temperature": route["temperature"],
            "messages": [{"role": "user", "content": prompt}],
        }
        headers = {
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }
        t0 = time.time()
        try:
            response = requests.post(
                ANTHROPIC_API_URL,
                json=payload,
                headers=headers,
                timeout=route["timeout"],
            )
        except requests.exceptions.Timeout:
            raise RuntimeError(
                f"Claude took longer than {route['timeout']}s to respond. "
                "Try increasing LLM_TIMEOUT in .env."
            )
        elapsed = time.time() - t0
        logger.info("Claude responded in %.1fs", elapsed)
        if response.status_code != 200:
            logger.warning("Claude API error status=%s body=%s", response.status_code, response.text[:500] if response.text else "")
            raise RuntimeError(response.text)
        data = response.json()
        if not data.get("content") or not isinstance(data["content"], list):
            raise RuntimeError("Unexpected Claude API response format")
        for block in data["content"]:
            if block.get("type") == "text":
                return block.get("text", "")
        return ""

    def _call_gemini(self, prompt: str, route: _LLMRoute) -> str:
        api_key = (route["gemini_api_key"] or "").strip()
        if not api_key:
            raise RuntimeError(
                "Gemini API key is not set. Set GEMINI_API_KEY in .env or enter it in Settings."
            )
        model = route["gemini_model"]
        t0 = time.time()
        try:
            response = _gemini_generate_content(
                model=model,
                api_key=api_key,
                prompt=prompt,
                max_tokens=route["gemini_max_tokens"],
                temperature=route["temperature"],
                timeout=route["timeout"],
            )
        except requests.exceptions.Timeout:
            raise RuntimeError(
                f"Gemini took longer than {route['timeout']}s to respond. "
                "Try increasing LLM_TIMEOUT in .env."
            )
        elapsed = time.time() - t0
        logger.info("Gemini responded in %.1fs", elapsed)
        if response.status_code != 200:
            detail = _gemini_http_error_message(response)
            should_retry_with_fallback = (
                response.status_code == 404
                and model != GEMINI_FALLBACK_MODEL
                and "not found" in detail.lower()
            )
            if should_retry_with_fallback:
                logger.warning(
                    "Gemini model %s unavailable; retrying with fallback %s",
                    model,
                    GEMINI_FALLBACK_MODEL,
                )
                try:
                    response = _gemini_generate_content(
                        model=GEMINI_FALLBACK_MODEL,
                        api_key=api_key,
                        prompt=prompt,
                        max_tokens=route["gemini_max_tokens"],
                        temperature=route["temperature"],
                        timeout=route["timeout"],
                    )
                except requests.exceptions.Timeout:
                    raise RuntimeError(
                        f"Gemini fallback model {GEMINI_FALLBACK_MODEL} took longer than "
                        f"{route['timeout']}s to respond. Try increasing LLM_TIMEOUT in .env."
                    )
                if response.status_code == 200:
                    logger.info(
                        "Gemini fallback model %s succeeded after %s returned 404",
                        GEMINI_FALLBACK_MODEL,
                        model,
                    )
                else:
                    detail = _gemini_http_error_message(response)
            logger.warning(
                "Gemini API error status=%s detail=%s",
                response.status_code,
                detail[:500],
            )
            raise RuntimeError(
                f"Gemini API error ({response.status_code}): {detail}"
            )
        data = response.json()
        candidates = data.get("candidates") or []
        if not candidates:
            # Gemini can return no candidates (e.g. safety filter, or error in payload)
            fb = data.get("promptFeedback") or {}
            block = fb.get("blockReason")
            logger.warning(
                "Gemini returned no candidates; response keys=%s, full body (truncated)=%s",
                list(data.keys()),
                str(data)[:800],
            )
            hint = (
                f" Block reason: {block}."
                if block
                else " (often safety filters or an empty model response)."
            )
            raise RuntimeError(
                "Gemini returned no text." + hint
                + " Try another model in Settings (e.g. gemini-2.0-flash) or rephrase the query."
            )
        parts = candidates[0].get("content", {}).get("parts") or []
        if not parts:
            return ""
        return parts[0].get("text", "")

    def seed_cache(self, prompt: str, response: str) -> None:
        """Pre-populate cache with a known prompt/response pair."""
        self.cache.seed(prompt, response, _cache_route_segment(_resolve_llm_route()))

    @property
    def cache_size(self) -> int:
        return self.cache.size
