"""
FastAPI application factory and OpenAPI configuration.
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from src.core.config import API_TITLE, API_VERSION, API_V1_PREFIX
from src.api.routers import auth, health, recommendations, movies, catalog, settings

# Ensure backend loggers show INFO so LLM switch and recommendation debug logs are visible
_src_log = logging.getLogger("src")
_src_log.setLevel(logging.INFO)
if not _src_log.handlers:
    _h = logging.StreamHandler()
    _h.setLevel(logging.INFO)
    _h.setFormatter(logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s"))
    _src_log.addHandler(_h)
    _src_log.propagate = False  # avoid duplicate lines when root also has a handler


def create_app() -> FastAPI:
    app = FastAPI(
        title=API_TITLE,
        version=API_VERSION,
        description=(
            "Semantic movie recommendation API powered by AISCA: "
            "user preferences are encoded and matched against a movie referential. "
            "Top 3 recommendations are returned with an AI-generated explanation."
        ),
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers under /api/v1
    app.include_router(health.router, prefix=API_V1_PREFIX)
    app.include_router(auth.router, prefix=API_V1_PREFIX)
    app.include_router(recommendations.router, prefix=API_V1_PREFIX)
    app.include_router(movies.router, prefix=API_V1_PREFIX)
    app.include_router(catalog.router, prefix=API_V1_PREFIX)
    app.include_router(settings.router, prefix=API_V1_PREFIX)

    # Root redirect or minimal response for /
    @app.get("/", tags=["Root"])
    def root():
        return {
            "message": "AISCA Movie Recommender API",
            "docs": "/docs",
            "redoc": "/redoc",
            "openapi": "/openapi.json",
            "health": f"{API_V1_PREFIX}/health",
        }

    return app


app = create_app()


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title=API_TITLE,
        version=API_VERSION,
        description=app.description,
        routes=app.routes,
    )
    # Add Bearer auth so "Authorize" works in Swagger UI
    openapi_schema.setdefault("components", {})
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Access token from POST /api/v1/auth/login",
        }
    }
    # Mark protected routes (recommendations, settings) as requiring auth
    for path, methods in openapi_schema.get("paths", {}).items():
        for method, spec in methods.items():
            if method in ("get", "post", "put", "delete", "patch") and isinstance(spec, dict):
                if "recommendations" in path or "settings" in path:
                    spec["security"] = [{"BearerAuth": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = custom_openapi
