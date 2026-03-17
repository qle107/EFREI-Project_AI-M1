"""
LLM client with in-memory response cache.

Supports Ollama (local), Anthropic Claude, and Google Gemini. Caching satisfies
Annexe I req 1.5.3 (responsible, cost-aware GenAI usage).
"""
import hashlib
import logging
import time
from threading import Lock
from typing import Any

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


class _PromptCache:
    """Thread-safe in-memory LRU-ish cache keyed by prompt SHA-256."""

    def __init__(self, ttl: int, max_size: int):
        self.ttl = ttl
        self.max_size = max_size
        self._store: dict[str, tuple[str, float]] = {}
        self._lock = Lock()

    @staticmethod
    def _key(prompt: str) -> str:
        return hashlib.sha256(prompt.encode()).hexdigest()

    def get(self, prompt: str) -> str | None:
        if self.ttl <= 0:
            return None
        key = self._key(prompt)
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                return None
            value, ts = entry
            if time.time() - ts > self.ttl:
                del self._store[key]
                return None
            return value

    def put(self, prompt: str, response: str) -> None:
        if self.ttl <= 0:
            return
        key = self._key(prompt)
        with self._lock:
            if len(self._store) >= self.max_size and key not in self._store:
                oldest_key = min(self._store, key=lambda k: self._store[k][1])
                del self._store[oldest_key]
            self._store[key] = (response, time.time())

    def seed(self, prompt: str, response: str) -> None:
        """Insert a pre-computed entry (for preset queries)."""
        self.put(prompt, response)

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
        logger.info("LLM generate() called — provider=%s", self._provider)
        cached = self.cache.get(prompt)
        if cached is not None:
            logger.info("LLM cache HIT (cache size: %d)", self.cache.size)
            return cached

        if self._provider == "anthropic":
            logger.info("LLM cache MISS — calling Claude (%s)", self._anthropic_model)
            response_text = self._call_anthropic(prompt)
        elif self._provider == "gemini":
            logger.info("LLM cache MISS — calling Gemini (%s)", self._gemini_model)
            response_text = self._call_gemini(prompt)
        else:
            logger.info("LLM cache MISS — calling Ollama (%s)", self.model)
            response_text = self._call_ollama(prompt)
        self.cache.put(prompt, response_text)
        return response_text

    def _call_ollama(self, prompt: str) -> str:
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": self._num_predict,
                "temperature": self._temperature,
            },
        }

        t0 = time.time()
        try:
            response = requests.post(self.url, json=payload, timeout=self._timeout)
        except requests.exceptions.Timeout:
            raise RuntimeError(
                f"Ollama took longer than {self._timeout}s to respond. "
                "Try increasing LLM_TIMEOUT in .env or use a smaller model (e.g. phi3:mini)."
            )
        elapsed = time.time() - t0
        logger.info("Ollama responded in %.1fs", elapsed)

        if response.status_code != 200:
            logger.warning("Ollama API error status=%s body=%s", response.status_code, response.text[:500] if response.text else "")
            raise RuntimeError(response.text)

        return response.json()["response"]

    def _call_anthropic(self, prompt: str) -> str:
        api_key = (self._anthropic_api_key or "").strip()
        if not api_key:
            raise RuntimeError(
                "Claude API key is not set. Set ANTHROPIC_API_KEY in .env or enter it in Settings."
            )
        payload = {
            "model": self._anthropic_model,
            "max_tokens": self._anthropic_max_tokens,
            "temperature": self._temperature,
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
                timeout=self._timeout,
            )
        except requests.exceptions.Timeout:
            raise RuntimeError(
                f"Claude took longer than {self._timeout}s to respond. "
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

    def _call_gemini(self, prompt: str) -> str:
        api_key = (self._gemini_api_key or "").strip()
        if not api_key:
            raise RuntimeError(
                "Gemini API key is not set. Set GEMINI_API_KEY in .env or enter it in Settings."
            )
        url = f"{GEMINI_API_BASE}/{self._gemini_model}:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "maxOutputTokens": self._gemini_max_tokens,
                "temperature": self._temperature,
            },
        }
        t0 = time.time()
        try:
            response = requests.post(url, json=payload, timeout=self._timeout)
        except requests.exceptions.Timeout:
            raise RuntimeError(
                f"Gemini took longer than {self._timeout}s to respond. "
                "Try increasing LLM_TIMEOUT in .env."
            )
        elapsed = time.time() - t0
        logger.info("Gemini responded in %.1fs", elapsed)
        if response.status_code != 200:
            logger.warning("Gemini API error status=%s body=%s", response.status_code, response.text[:500] if response.text else "")
            raise RuntimeError(response.text)
        data = response.json()
        candidates = data.get("candidates") or []
        if not candidates:
            # Gemini can return no candidates (e.g. safety filter, or error in payload)
            logger.warning(
                "Gemini returned no candidates; response keys=%s, full body (truncated)=%s",
                list(data.keys()),
                str(data)[:800],
            )
            raise RuntimeError("Gemini returned no candidates")
        parts = candidates[0].get("content", {}).get("parts") or []
        if not parts:
            return ""
        return parts[0].get("text", "")

    def seed_cache(self, prompt: str, response: str) -> None:
        """Pre-populate cache with a known prompt/response pair."""
        self.cache.seed(prompt, response)

    @property
    def cache_size(self) -> int:
        return self.cache.size
