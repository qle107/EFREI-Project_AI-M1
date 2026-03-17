"""
Runtime-editable LLM settings (defaults from env, overridable via API).

Used by LLMClient so the frontend settings page can change provider (Ollama, Claude, Gemini),
model, num_predict, temperature, cache, and optionally API keys (stored in memory only).
"""
import logging
import os
from threading import Lock
from typing import Any

logger = logging.getLogger(__name__)

# Defaults from env (same as config.py)
_DEFAULTS = {
    "provider": os.getenv("LLM_PROVIDER", "ollama").lower(),
    "llm_url": os.getenv("LLM_URL", "http://localhost:11434/api/generate"),
    "llm_model": os.getenv("LLM_MODEL", "phi3:mini"),
    "num_predict": int(os.getenv("LLM_NUM_PREDICT", "256")),
    "temperature": float(os.getenv("LLM_TEMPERATURE", "0.3")),
    "cache_ttl": int(os.getenv("LLM_CACHE_TTL", "86400")),
    "cache_max_size": int(os.getenv("LLM_CACHE_MAX_SIZE", "200")),
    "anthropic_model": os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-20241022"),
    "anthropic_max_tokens": int(os.getenv("ANTHROPIC_MAX_TOKENS", "512")),
    "gemini_model": os.getenv("GEMINI_MODEL", "gemini-1.5-flash"),
    "gemini_max_tokens": int(os.getenv("GEMINI_MAX_TOKENS", "512")),
}

_lock = Lock()
_overrides: dict[str, Any] = {}
# API keys set from Settings page (never returned by get_llm_runtime); used only by LLMClient
_secret_overrides: dict[str, str] = {}


def get_llm_runtime() -> dict[str, Any]:
    """Current LLM settings (defaults + overrides). Never includes API keys. Thread-safe."""
    with _lock:
        return {**_DEFAULTS, **_overrides}


def get_llm_runtime_for_client() -> dict[str, Any]:
    """Runtime config including API keys, for LLMClient only. Thread-safe."""
    with _lock:
        return {**_DEFAULTS, **_overrides, **_secret_overrides}


def get_anthropic_configured() -> bool:
    """True if Claude can be used (key in env or set via Settings). Thread-safe."""
    with _lock:
        runtime_key = (_secret_overrides.get("anthropic_api_key") or "").strip()
    return bool(runtime_key or os.getenv("ANTHROPIC_API_KEY", "").strip())


def get_gemini_configured() -> bool:
    """True if Gemini can be used (key in env or set via Settings). Thread-safe."""
    with _lock:
        runtime_key = (_secret_overrides.get("gemini_api_key") or "").strip()
    return bool(runtime_key or os.getenv("GEMINI_API_KEY", "").strip())


def update_llm_runtime(updates: dict[str, Any]) -> dict[str, Any]:
    """Apply partial updates and return current settings. Thread-safe."""
    allowed = {
        "provider", "llm_url", "llm_model", "num_predict", "temperature",
        "cache_ttl", "cache_max_size", "anthropic_model", "anthropic_max_tokens",
        "gemini_model", "gemini_max_tokens",
    }
    secret_keys = {"anthropic_api_key", "gemini_api_key"}
    with _lock:
        changed: list[str] = []
        for k, v in updates.items():
            if k in secret_keys:
                if v is None:
                    continue
                s = (v if isinstance(v, str) else "").strip()
                if s:
                    _secret_overrides[k] = s
                    changed.append(f"{k}=<set>")
                else:
                    _secret_overrides.pop(k, None)
                    changed.append(f"{k}=<cleared>")
                continue
            if k not in allowed or v is None:
                continue
            if k == "provider" and isinstance(v, str):
                p = v.strip().lower()
                if p in ("ollama", "anthropic", "gemini"):
                    _overrides[k] = p
                    changed.append(f"provider={p}")
            elif k == "num_predict":
                _overrides[k] = max(64, min(2048, int(v)))
                changed.append(f"num_predict={_overrides[k]}")
            elif k == "temperature":
                _overrides[k] = max(0.0, min(1.0, float(v)))
                changed.append(f"temperature={_overrides[k]}")
            elif k == "cache_ttl":
                _overrides[k] = max(0, int(v))
                changed.append(f"cache_ttl={_overrides[k]}")
            elif k == "cache_max_size":
                _overrides[k] = max(0, min(1000, int(v)))
                changed.append(f"cache_max_size={_overrides[k]}")
            elif k == "anthropic_max_tokens":
                _overrides[k] = max(64, min(8192, int(v)))
                changed.append(f"anthropic_max_tokens={_overrides[k]}")
            elif k == "gemini_max_tokens":
                _overrides[k] = max(64, min(8192, int(v)))
                changed.append(f"gemini_max_tokens={_overrides[k]}")
            elif k in ("llm_url", "llm_model", "anthropic_model", "gemini_model") and isinstance(v, str):
                _overrides[k] = v.strip() or _DEFAULTS.get(k, "")
                changed.append(f"{k}={_overrides[k]}")
        result = {**_DEFAULTS, **_overrides}
        if changed:
            logger.info(
                "LLM runtime updated: %s → provider=%s, ollama url=%s, ollama model=%s, anthropic_model=%s, gemini_model=%s, num_predict=%s, temperature=%s",
                ", ".join(changed),
                result.get("provider"),
                result.get("llm_url"),
                result.get("llm_model"),
                result.get("anthropic_model"),
                result.get("gemini_model"),
                result.get("num_predict"),
                result.get("temperature"),
            )
        return result
