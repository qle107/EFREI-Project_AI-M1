# EFREI-Project_AI-M1

AISCA Semantic Movie Recommender ? backend API and pipeline.

## Backend API

### OpenAPI documentation

You can use the API spec **without running the server**:

| What | Where |
|------|--------|
| **OpenAPI JSON** (static) | [`docs/openapi.json`](docs/openapi.json) |
| **OpenAPI YAML** (static) | [`docs/openapi.yaml`](docs/openapi.yaml) |

When the API is running:

| What | URL |
|------|-----|
| **Swagger UI** | [http://localhost:8000/docs](http://localhost:8000/docs) |
| **ReDoc** | [http://localhost:8000/redoc](http://localhost:8000/redoc) |
| **OpenAPI JSON** (live) | [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json) |

To regenerate the static OpenAPI files after changing the API:

```bash
python scripts/generate_openapi.py
```

### Run the API

```bash
# From project root (recommended: use a venv and pip install -r requirement.txt)
python -m src.main
# or: uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8000
# Do not `cd src` first — imports use the `src.*` package and need the repo root on PYTHONPATH.
```

### Authentication (JWT)

- **Login:** `POST /api/v1/auth/login` with body `{"username": "admin", "password": "admin"}` ? returns `access_token` and `refresh_token`.
- **Refresh:** `POST /api/v1/auth/refresh` with body `{"refresh_token": "<token>"}`.
- **Current user:** `GET /api/v1/auth/me` with header `Authorization: Bearer <access_token>`.

Default credentials: `admin` / `admin`. Override via env: `DEMO_USERNAME`, `DEMO_PASSWORD_HASH` (bcrypt hash).

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/health` | No | Health check |
| POST | `/api/v1/auth/login` | No | Login (get tokens) |
| POST | `/api/v1/auth/refresh` | No | Refresh tokens |
| GET | `/api/v1/auth/me` | Bearer | Current user |
| POST | `/api/v1/recommendations` | Bearer | Get top 3 movie recommendations + AI explanation (includes `film_id`, `poster_url`) |
| GET | `/api/v1/movies` | No | Paginated movie list with optional `search`, `mood`, `genre`; includes `poster_url`, `vote_average` |
| GET | `/api/v1/movies/{film_id}` | No | Single movie detail (poster, overview, release_date, etc.) for modals/detail page |
| GET | `/api/v1/catalog/options` | No | Options for dropdowns: `moods`, `genres`, `styles` |
| GET | `/api/v1/settings/llm` | Bearer | Current LLM settings (provider: Ollama / Claude / Gemini, model, cache, etc.) |
| PUT | `/api/v1/settings/llm` | Bearer | Update LLM provider or options (switch between Ollama, Claude, Gemini) |
| POST | `/api/v1/settings/llm/clear-cache` | Bearer | Clear in-memory LLM response cache |

### Recommendation request body

Get valid options for mood/genre/style from **`GET /api/v1/catalog/options`** so labels match the catalog.

| Field | Meaning | Valid values |
|-------|--------|--------------|
| `description` | Free text: tone, themes, what to avoid | Any; be specific (min 10 chars) |
| `preferred_mood` | Atmosphere (e.g. dark, tense) | Use `catalog/options` ? `moods` |
| `preferred_genre` | Theme / genre (e.g. crime, sci-fi) | Use `catalog/options` ? `genres` |
| `preferred_style` | Pacing / style (e.g. mystery, action) | Use `catalog/options` ? `styles` |
| `mood_intensity` | How strong the mood should be | **1** = subtle ? **5** = central |
| `theme_interest` | How important theme is to the match | **1** = secondary ? **5** = very important |
| `style_interest` | How important pacing/style is | **1** = matters little ? **5** = very important |

Example:

```json
{
  "description": "I want a slow-burn sci-fi thriller with a mysterious vibe, ethical dilemmas about AI, and a tense atmosphere. Minimal romance, smart dialogue, and a satisfying twist.",
  "preferred_mood": "tense",
  "preferred_genre": "science fiction",
  "preferred_style": "mystery",
  "mood_intensity": 5,
  "theme_interest": 4,
  "style_interest": 4
}
```

### Response shape (for the frontend)

Success responses use an envelope:

```json
{
  "data": {
    "recommendations": [
      {
        "film_id": 1,
        "title": "The Batman",
        "poster_url": "https://image.tmdb.org/t/p/original/74xTEgt7R36Fpooo50r9T25onhq.jpg",
        "coverage_score": 0.82,
        "mood_score": 0.91,
        "theme_score": 0.88,
        "style_score": 0.75,
        "desc_score": 0.79
      }
    ],
    "explanation": "These three films match your preference for..."
  },
  "meta": {
    "timestamp": "2025-02-16T12:00:00.000000+00:00",
    "user_id": "1"
  }
}
```

**UI-oriented:** Use `GET /api/v1/catalog/options` for dropdowns; `GET /api/v1/movies` for browse (with `poster_url`); `GET /api/v1/movies/{film_id}` for detail/modals. Recommendation items include `film_id` and `poster_url` for linking and images.

### Environment (optional)

Create a `.env` or set in the shell:

- `SECRET_KEY` ? JWT signing key (required in production).
- `DEMO_USERNAME` / `DEMO_PASSWORD_HASH` ? override default user (hash with bcrypt).
- **LLM**: `LLM_PROVIDER` = `ollama` (default), `anthropic`, or `gemini`. For Ollama: `LLM_URL` / `LLM_MODEL` (default: `http://localhost:11434/api/generate`, `phi3:mini`). For Claude: `ANTHROPIC_API_KEY`. For Gemini: `GEMINI_API_KEY`. You can switch between the three in the app (Settings or Recommend page).
