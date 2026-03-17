"""
Application configuration.
Uses environment variables with sensible defaults for local development.
"""
import os
from pathlib import Path

# Project root (parent of src)
PROJECT_ROOT: Path = Path(__file__).resolve().parent.parent.parent


def _load_env_file() -> None:
    """
    Load key/value pairs from PROJECT_ROOT/.env into process env.

    - Keeps already-exported environment variables untouched.
    - Supports simple KEY=VALUE lines and optional single/double quotes.
    """
    env_path = PROJECT_ROOT / ".env"
    if not env_path.exists():
        return

    try:
        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip()
            if not key:
                continue
            if (value.startswith('"') and value.endswith('"')) or (
                value.startswith("'") and value.endswith("'")
            ):
                value = value[1:-1]
            os.environ.setdefault(key, value)
    except OSError:
        # If .env cannot be read, keep running with existing environment.
        pass


_load_env_file()

# Paths relative to project root
DATA_DIR: Path = PROJECT_ROOT / "data"
PROCESSED_DIR: Path = DATA_DIR / "processed"
MODELS_DIR: Path = PROJECT_ROOT / "models"
EMBEDDINGS_DIR: Path = MODELS_DIR / "embeddings"

# Auth / JWT (override via env in production)
SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "120"))  # 2 hours
REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))  # 30 days

# Default backend user (no DB). Override via env in production.
DEMO_USERNAME: str = os.getenv("DEMO_USERNAME", "admin")
DEMO_PASSWORD_HASH: str = os.getenv(
    "DEMO_PASSWORD_HASH",
    "",  # Set via env or we hash "admin" at me
)

# LLM: "ollama" (local), "anthropic" (Claude), or "gemini" (Google)
LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "ollama").lower()

# Ollama (when LLM_PROVIDER=ollama)
LLM_URL: str = os.getenv("LLM_URL", "http://localhost:11434/api/generate")
LLM_MODEL: str = os.getenv("LLM_MODEL", "phi3:mini")
LLM_NUM_PREDICT: int = int(os.getenv("LLM_NUM_PREDICT", "256"))
LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.3"))
LLM_TIMEOUT: int = int(os.getenv("LLM_TIMEOUT", "300"))  # seconds; Ollama/phi3 can be slow on CPU

# Anthropic Claude (when LLM_PROVIDER=anthropic). Key only in env.
ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL: str = os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-20241022")
ANTHROPIC_MAX_TOKENS: int = int(os.getenv("ANTHROPIC_MAX_TOKENS", "512"))

# Google Gemini (when LLM_PROVIDER=gemini). Key only in env.
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
GEMINI_MAX_TOKENS: int = int(os.getenv("GEMINI_MAX_TOKENS", "512"))

# LLM response cache (req 1.5.3: responsible, cost-aware usage)
LLM_CACHE_TTL: int = int(os.getenv("LLM_CACHE_TTL", "86400"))  # seconds; 0 = disabled
LLM_CACHE_MAX_SIZE: int = int(os.getenv("LLM_CACHE_MAX_SIZE", "200"))

# API
API_V1_PREFIX: str = "/api/v1"
API_TITLE: str = "AISCA Semantic Movie Recommender API"
API_VERSION: str = "1.0.0"
