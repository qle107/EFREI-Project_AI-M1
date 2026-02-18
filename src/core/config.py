"""
Application configuration.
Uses environment variables with sensible defaults for local development.
"""
import os
from pathlib import Path
from typing import Optional

# Project root (parent of src)
PROJECT_ROOT: Path = Path(__file__).resolve().parent.parent.parent

# Paths relative to project root
DATA_DIR: Path = PROJECT_ROOT / "data"
PROCESSED_DIR: Path = DATA_DIR / "processed"
MODELS_DIR: Path = PROJECT_ROOT / "models"
EMBEDDINGS_DIR: Path = MODELS_DIR / "embeddings"

# Auth / JWT (override via env in production)
SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Default backend user (no DB). Override via env in production.
DEMO_USERNAME: str = os.getenv("DEMO_USERNAME", "admin")
DEMO_PASSWORD_HASH: str = os.getenv(
    "DEMO_PASSWORD_HASH",
    "",  # Set via env or we hash "admin" at runtime
)

# LLM (Ollama)
LLM_URL: str = os.getenv("LLM_URL", "http://localhost:11434/api/generate")
LLM_MODEL: str = os.getenv("LLM_MODEL", "phi3:mini")

# API
API_V1_PREFIX: str = "/api/v1"
API_TITLE: str = "AISCA Semantic Movie Recommender API"
API_VERSION: str = "1.0.0"
