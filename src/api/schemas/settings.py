"""Schemas for LLM and app settings (settings page API)."""
from typing import Literal, Optional

from pydantic import BaseModel, Field

ProviderLiteral = Literal["ollama", "anthropic", "gemini"]


class LLMSettingsOut(BaseModel):
    """Current LLM settings (read-only for GET). API key is never returned."""

    provider: ProviderLiteral = Field(..., description="LLM backend: ollama, anthropic (Claude), or gemini")
    llm_url: str = Field(..., description="Ollama API base URL (used when provider=ollama)")
    llm_model: str = Field(..., description="Ollama model name (e.g. phi3:mini)")
    num_predict: int = Field(..., ge=64, le=2048, description="Max tokens (Ollama)")
    temperature: float = Field(..., ge=0.0, le=1.0, description="Sampling temperature")
    cache_ttl: int = Field(..., ge=0, description="Cache TTL in seconds (0 = disabled)")
    cache_max_size: int = Field(..., ge=0, le=1000, description="Max cached prompt/response pairs")
    cache_size: Optional[int] = Field(None, description="Current number of entries in cache (if available)")
    anthropic_model: str = Field(..., description="Claude model ID (used when provider=anthropic)")
    anthropic_max_tokens: int = Field(..., ge=64, le=8192, description="Max tokens for Claude")
    anthropic_configured: bool = Field(False, description="True if ANTHROPIC_API_KEY is set (key never exposed)")
    gemini_model: str = Field(..., description="Gemini model ID (used when provider=gemini)")
    gemini_max_tokens: int = Field(..., ge=64, le=8192, description="Max tokens for Gemini")
    gemini_configured: bool = Field(False, description="True if GEMINI_API_KEY is set (key never exposed)")


class LLMSettingsUpdate(BaseModel):
    """Partial update for LLM settings (PUT body)."""

    provider: Optional[ProviderLiteral] = None
    llm_url: Optional[str] = Field(None, min_length=1, description="Ollama API URL")
    llm_model: Optional[str] = Field(None, min_length=1, description="Ollama model name")
    num_predict: Optional[int] = Field(None, ge=64, le=2048)
    temperature: Optional[float] = Field(None, ge=0.0, le=1.0)
    cache_ttl: Optional[int] = Field(None, ge=0)
    cache_max_size: Optional[int] = Field(None, ge=0, le=1000)
    anthropic_model: Optional[str] = Field(None, min_length=1, description="Claude model ID")
    anthropic_max_tokens: Optional[int] = Field(None, ge=64, le=8192)
    anthropic_api_key: Optional[str] = Field(None, description="Claude API key (stored in memory only; leave blank to use .env)")
    gemini_model: Optional[str] = Field(None, min_length=1, description="Gemini model ID")
    gemini_max_tokens: Optional[int] = Field(None, ge=64, le=8192)
    gemini_api_key: Optional[str] = Field(None, description="Gemini API key (stored in memory only; leave blank to use .env)")
