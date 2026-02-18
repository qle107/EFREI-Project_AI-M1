# AISCA Movie Recommender — Project Documentation

**Full technical documentation of the EFREI AI M1 movie recommendation system**

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Getting Started](#2-getting-started)
3. [Dataset](#3-dataset)
4. [Models](#4-models)
5. [Architecture & Data Flow](#5-architecture--data-flow)
6. [Techniques](#6-techniques)
7. [Functionalities](#7-functionalities)
8. [Backend API (REST, OpenAPI, JWT)](#8-backend-api-rest-openapi-jwt)
9. [Examples](#9-examples)
10. [Project Structure](#10-project-structure)

---

## 1. Project Overview

**AISCA** (AI Semantic Coverage Analysis) is an AI-powered movie recommendation system that combines:

- **Semantic embeddings** (Sentence-BERT) for understanding movie content and user preferences
- **Multi-dimensional scoring** across mood, theme, narrative style, and description
- **Generative AI** (LLM via Ollama) to produce natural-language explanations of recommendations

The system is designed for M1-level AI coursework and demonstrates retrieval-augmented generation (RAG), semantic search, and hybrid recommendation approaches.

---

## 2. Getting Started

### 2.1 Prerequisites

| Requirement | Notes |
|-------------|-------|
| **Python 3.8+** | Recommended: 3.10 or 3.11 |
| **Ollama** | For GenAI explanations. [Download](https://ollama.ai) |
| **~2 GB RAM** | For SBERT model + embeddings |

### 2.2 Installation

**1. Clone the repository and navigate to the project root**

```bash
cd EFREI-Project_AI-M1
```

**2. Create a virtual environment (recommended)**

```bash
python -m venv .venv
```

**3. Activate the virtual environment**

- **Windows (PowerShell):**
  ```powershell
  .\.venv\Scripts\Activate.ps1
  ```
- **Windows (CMD):**
  ```cmd
  .\.venv\Scripts\activate.bat
  ```
- **Linux/macOS:**
  ```bash
  source .venv/bin/activate
  ```

**4. Install dependencies**

```bash
pip install -r requirement.txt
```

> **Note:** The project uses `requirement.txt` (singular). PyTorch may take a few minutes to install. For CPU-only, you can use:  
> `pip install torch --index-url https://download.pytorch.org/whl/cpu`  
> before installing the rest.

### 2.3 Offline Pipeline (Required Before First Use)

The API needs precomputed movie embeddings. Run these steps **once** from the project root:

**Step 1: Create the referential** (extract semantic blocks from raw data)

```bash
python -c "
from src.preprocessing.referential_builder import create_referential
create_referential(
    input_path='data/raw/Database_Cleaned.csv',
    output_path='data/processed/movies_referential.csv'
)
"
```

**Step 2: Build embeddings** (encode blocks with SBERT; ~5–10 min for ~10k movies)

```bash
python -c "
from src.embedding.embedding_builder import build_block_embeddings
build_block_embeddings(
    referential_path='data/processed/movies_referential.csv',
    save_folder='models/embeddings/'
)
"
```

**Or run both via the execution script** (uncomment the relevant blocks in `execute/main_step_1.py`):

```python
# In execute/main_step_1.py, uncomment lines 16–27
```

Ensure these exist before starting the API:
- `data/processed/movies_referential.csv`
- `models/embeddings/mood_embeddings.npy`
- `models/embeddings/theme_embeddings.npy`
- `models/embeddings/style_embeddings.npy`
- `models/embeddings/desc_embeddings.npy`

### 2.4 Start Ollama (for GenAI explanations)

In a **separate terminal**, start the Ollama LLM:

```bash
ollama run phi3
```

Leave this running. The API calls `http://localhost:11434/api/generate` to get explanations.

### 2.5 Start the API

From the **project root** (important for relative paths):

```bash
python -m src.main
```

The server starts at `http://0.0.0.0:8000`.

**Alternative (direct uvicorn):**

```bash
uvicorn src.api.api:app --host 0.0.0.0 --port 8000 --reload
```

> **Important:** Run from the project root so `models/embeddings/` and `data/processed/` resolve correctly. Paths are resolved via `src.core.config` (e.g. `PROCESSED_DIR`, `EMBEDDINGS_DIR`).

### 2.6 Verify the API

**Root (discovery):**

```bash
curl http://localhost:8000/
```

Returns links to `/docs`, `/redoc`, `/openapi.json`, and `/api/v1/health`.

**Health check:**

```bash
curl http://localhost:8000/api/v1/health
```

Expected: `{"status":"ok","version":"1.0.0"}`.

**OpenAPI docs (browser):**

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- Raw spec: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

**Get recommendations (requires login):**

1. Login to get a JWT:
   ```bash
   curl -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"username\":\"admin\",\"password\":\"admin\"}"
   ```
   Copy the `access_token` from the response.

2. Call recommendations with the token:
   ```bash
   curl -X POST http://localhost:8000/api/v1/recommendations -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_ACCESS_TOKEN" -d "{\"description\":\"dark crime thriller with mystery\",\"preferred_mood\":\"dark\",\"preferred_genre\":\"crime\",\"preferred_style\":\"mystery\",\"mood_intensity\":5,\"theme_interest\":4,\"style_interest\":3}"
   ```

(On Linux/macOS, use `\` instead of `^` for line continuation in multi-line commands.)

### 2.7 Other Ways to Run

| Mode | Command | Notes |
|------|---------|------|
| **CLI test** | `python execute/main_step_1.py` | Runs pipeline + prints explanation (requires Ollama) |
| **Streamlit UI** | `streamlit run execute/main_step_1.py` | Note: `main_step_1.py` mixes CLI and Streamlit; a dedicated `app.py` is recommended for Streamlit |
| **Alternative RAG** | Use `MovieRecommenderPipeline` in Python | Does not require precomputed embeddings (builds on the fly) |

### 2.8 Quick Reference — All Commands

```bash
# 1. Setup
python -m venv .venv
.\.venv\Scripts\Activate.ps1          # Windows PowerShell
pip install -r requirement.txt

# 2. Offline pipeline (one-time)
python -c "from src.preprocessing.referential_builder import create_referential; create_referential('data/raw/Database_Cleaned.csv', 'data/processed/movies_referential.csv')"
python -c "from src.embedding.embedding_builder import build_block_embeddings; build_block_embeddings('data/processed/movies_referential.csv')"

# 3. Start Ollama (separate terminal)
ollama run phi3

# 4. Start API (from project root)
python -m src.main

# 5. Test
curl http://localhost:8000/api/v1/health
# Login: POST /api/v1/auth/login with {"username":"admin","password":"admin"}
# Recommendations: POST /api/v1/recommendations with Authorization: Bearer <token>
```

---

## 3. Dataset

### 3.1 Raw Data

| File | Description | Rows |
|------|-------------|------|
| `data/raw/Database.csv` | Original TMDB-style movie dataset | ~9,840 |
| `data/raw/Database_Cleaned.csv` | Cleaned dataset with derived features | ~9,840 |

### 3.2 Schema (Raw)

| Column | Type | Description |
|--------|------|-------------|
| `Release_Date` | date | Film release date |
| `Title` | string | Movie title |
| `Overview` | string | Plot summary |
| `Popularity` | float | TMDB popularity score |
| `Vote_Count` | int | Number of votes |
| `Vote_Average` | float | Average rating |
| `Original_Language` | string | Language code |
| `Genre` | string | Comma-separated genres |
| `Poster_Url` | string | Poster image URL |

### 3.3 Cleaned Schema (Database_Cleaned.csv)

Additional columns after cleaning:

| Column | Type | Description |
|--------|------|-------------|
| `Year` | float | Extracted release year |
| `Month` | float | Extracted month |
| `Month_Name` | string | Month name |
| `Day_of_Week` | string | Day of week |
| `Has_Poster` | bool | Whether poster URL exists |
| `Genre_List` | list | Genre as Python list |
| `Genre_Count` | int | Number of genres |
| `Primary_Genre` | string | First/main genre |

### 3.4 Processed Referential (movies_referential.csv)

Produced by the preprocessing pipeline for AISCA scoring:

| Column | Type | Description |
|--------|------|-------------|
| `FilmID` | int | Unique movie identifier |
| `Title` | string | Movie title |
| `Mood` | string | Extracted mood labels (e.g. `dark`, `tense`, `heroic`) |
| `Theme` | string | Extracted theme labels (e.g. `crime`, `fantasy`, `family`) |
| `NarrativeStyle` | string | Extracted style labels (e.g. `action`, `mystery`, `drama`) |
| `EmotionalTone` | string | Copy of Genre (original emotional/genre info) |
| `Description` | string | `Overview + " Genre: " + Genre` |

### 3.5 Sample Raw Row

```csv
Release_Date,Title,Overview,Popularity,Vote_Count,Vote_Average,Original_Language,Genre,Poster_Url
2022-03-01,The Batman,"In his second year of fighting crime, Batman uncovers corruption in Gotham City...",3827.658,1151,8.1,en,"Crime, Mystery, Thriller",https://...
```

### 3.6 Sample Referential Row (After Block Extraction)

```csv
FilmID,Title,Mood,Theme,NarrativeStyle,EmotionalTone,Description
1,The Batman,"dark, uplifting","crime, family","mystery, drama","Crime, Mystery, Thriller","In his second year of fighting crime, Batman uncovers corruption..."
```

---

## 4. Models

### 4.1 Sentence-BERT (SBERT)

- **Model**: `sentence-transformers/all-MiniLM-L6-v2`
- **Purpose**: Encode text into 384-dimensional semantic vectors
- **Usage**:
  - User profile blocks (mood, theme, style, description)
  - Movie semantic blocks (Mood, Theme, NarrativeStyle, Description)
  - Combined text for the alternative RAG pipeline

**How it works**: Text is tokenized, passed through a MiniLM backbone, and mean-pooled to produce a fixed-size vector. Similar texts map to nearby vectors in the embedding space.

### 4.2 Taxonomy (Keyword-Based Extraction)

The project uses a custom taxonomy to map overview text to semantic labels:

**Mood Keywords** (`MOOD_KEYWORDS`):

| Label | Keywords |
|-------|----------|
| dark | crime, killer, murder, corruption |
| uplifting | family, gift, hope |
| tense | struggle, danger, kidnap, blizzard |
| heroic | hero, super, fight |

**Theme Keywords** (`THEME_KEYWORDS`):

| Label | Keywords |
|-------|----------|
| fantasy | magic, gift, power |
| crime | killer, corruption |
| survival | stranded, blizzard |
| family | family, child |

**Style Keywords** (`STYLE_KEYWORDS`):

| Label | Keywords |
|-------|----------|
| action | fight, danger |
| mystery | discover, uncovers |
| drama | family, life |

If no keyword matches, the label is `"neutral"`.

### 4.3 LLM (Ollama / Phi-3)

- **Model**: `phi3:mini` (configurable)
- **Endpoint**: `http://localhost:11434/api/generate`
- **Purpose**: Generate natural-language explanations for the top 3 recommendations

**Requirements**: Ollama must be running locally with `ollama run phi3` (or equivalent).

---

## 5. Architecture & Data Flow

### 5.1 Offline Pipeline (One-Time Setup)

```
Database_Cleaned.csv
        │
        ▼
┌───────────────────┐
│ referential_      │  Extract Mood, Theme, NarrativeStyle from Overview
│ builder           │  using taxonomy keywords
└─────────┬─────────┘
          │
          ▼
movies_referential.csv
          │
          ▼
┌───────────────────┐
│ embedding_        │  Encode each block with SBERT
│ builder           │  Save mood, theme, style, desc embeddings (.npy)
└─────────┬─────────┘
          │
          ▼
models/embeddings/
  ├── mood_embeddings.npy
  ├── theme_embeddings.npy
  ├── style_embeddings.npy
  └── desc_embeddings.npy
```

### 5.2 Online AISCA Recommendation Flow

```
Client: POST /api/v1/recommendations (Bearer JWT)
        │
        ▼
┌───────────────────┐
│ UserProfileEncoder│  Build 4 text blocks from questionnaire
│                   │  Encode each with SBERT
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ CoverageScorer    │  Cosine similarity: user vs all movies
│                   │  Weighted score: 0.35 mood + 0.25 theme + 0.20 style + 0.20 desc
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Recommendation    │  Sort by CoverageScore, take Top 3
│ Engine            │  Format output (FilmID, Title, scores)
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Movie catalog     │  Resolve poster_url by FilmID (for UI)
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ build_aisca_      │  Build prompt with user request + top 3 + scores
│ prompt            │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ LLMClient         │  Single Ollama API call
└─────────┬─────────┘
          │
          ▼
JSON Response { data: { recommendations, explanation }, meta }
```

### 5.3 Alternative RAG Pipeline (MovieRecommenderPipeline)

```
Raw CSV (Title, Overview, Genre)
        │
        ▼
combined_features = Title + Overview + " Genres: " + Genre
        │
        ▼
SBERT encode → corpus_embeddings (all movies)
        │
        ▼
User Input (free text) → SBERT encode → user_embedding
        │
        ▼
Cosine similarity(user_embedding, corpus_embeddings)
        │
        ▼
Top-K movies by semantic_score
        │
        ▼
Build prompt with context → Ollama → Explanation
```

---

## 6. Techniques

### 6.1 Semantic Block Extraction

**Location**: `src/preprocessing/block_builder.py`

Text is lowercased and scanned with regex `\b{keyword}\b` for word-boundary matches. Each taxonomy label is assigned if any of its keywords appear. Multiple labels can be assigned (e.g. `"dark, uplifting"`).

```python
# Example: Overview contains "corruption" and "family"
# → Mood: dark (corruption), uplifting (family)
# → Theme: crime (corruption), family (family)
```

### 6.2 Cosine Similarity

**Formula**: \(\text{similarity}(A, B) = \frac{A \cdot B}{\|A\| \|B\|}\)

- Range: [-1, 1] (typically [0, 1] for normalized embeddings)
- Used to compare user profile vectors with movie block vectors

**Implementation**: `sklearn.metrics.pairwise.cosine_similarity`

### 6.3 AISCA Weighted Score

\[
\text{CoverageScore} = 0.35 \cdot \text{MoodScore} + 0.25 \cdot \text{ThemeScore} + 0.20 \cdot \text{StyleScore} + 0.20 \cdot \text{DescScore}
\]

- **Mood** (35%): Emotional tone match
- **Theme** (25%): Genre/thematic match
- **Style** (20%): Narrative pacing match
- **Description** (20%): Semantic match to free-text description

### 6.4 Retrieval-Augmented Generation (RAG)

1. **Retrieve**: Semantic search returns top-K movies.
2. **Augment**: Top movies + scores are formatted into a context string.
3. **Generate**: LLM receives user request + context and produces an explanation.

This limits LLM hallucinations by grounding output in actual retrieved movies and scores.

### 6.5 Embedding Representation

- **Dimension**: 384 (MiniLM-L6-v2)
- **Normalization**: Typically L2-normalized by the model
- **Storage**: NumPy arrays (`.npy`) for fast loading

---

## 7. Functionalities

### 7.1 API Overview (Summary)

The backend exposes a versioned REST API under `/api/v1` with:

- **OpenAPI**: Live docs at `/docs` (Swagger) and `/redoc`; static spec in `docs/openapi.json` / `docs/openapi.yaml` (see [§8 Backend API](#8-backend-api-rest-openapi-jwt)).
- **Authentication**: JWT (login → access token; use `Authorization: Bearer <token>` for protected routes).
- **Recommendations**: `POST /api/v1/recommendations` returns top 3 movies with scores, `film_id`, `poster_url`, and an AI explanation (see [§8](#8-backend-api-rest-openapi-jwt) for full request/response).
- **Movies & catalog**: `GET /api/v1/movies` (list with posters/filters), `GET /api/v1/movies/{film_id}` (detail), `GET /api/v1/catalog/options` (moods/genres/styles for dropdowns).

### 7.2 User Profile Encoding

**Input**: Questionnaire with:
- `description` (str): Free-text preference
- `preferred_mood`, `preferred_genre`, `preferred_style` (str)
- `mood_intensity`, `theme_interest`, `style_interest` (int, 1–5)

**Output**: Four embedding vectors (mood, theme, style, description).

**Block construction**:

- Mood: `"The user wants a {mood} mood with intensity level {intensity}"`
- Theme: `"The user prefers {genre} themes with interest level {interest}"`
- Style: `"The user enjoys {style} narrative pacing with interest level {interest}"`
- Description: Raw `description` text

### 7.3 Coverage Scoring

Compares user profile embeddings with precomputed movie block embeddings, then applies the weighted formula. Returns the top 3 movies by `CoverageScore`.

### 7.4 Recommendation Engine

Takes scored movies, sorts by `CoverageScore`, returns top 3 with formatted scores (Title, CoverageScore, MoodScore, ThemeScore, StyleScore, DescScore).

### 7.5 GenAI Explanation

- Single LLM call (Ollama)
- Prompt includes: user request, top 3 movies, all 4 block scores
- Instructions: explain match, highlight strengths/weaknesses, suggest refinements, summarize (max ~150 words)

### 7.6 Visualization (Radar Charts)

- **Location**: `src/visualization/radar_plot.py`
- **Axes**: Mood, Theme, Style, Description
- **Values**: Block scores (0–1)

### 7.7 Alternative RAG Pipeline

- **Class**: `MovieRecommenderPipeline`
- **Input**: Free-text user query
- **Output**: Top-K movies + LLM explanation
- **Difference from AISCA**: Single combined embedding per movie (no block decomposition)

---

## 8. Backend API (REST, OpenAPI, JWT)

The API is structured for clear documentation, authentication, and UI consumption (posters, catalog options, pagination).

### 8.1 OpenAPI Documentation

| Resource | Location |
|----------|----------|
| **Swagger UI** | `http://localhost:8000/docs` (when server is running) |
| **ReDoc** | `http://localhost:8000/redoc` |
| **OpenAPI JSON** | `http://localhost:8000/openapi.json` |
| **Static JSON** | `docs/openapi.json` (in repo; no server needed) |
| **Static YAML** | `docs/openapi.yaml` |

Regenerate static specs after API changes:

```bash
python scripts/generate_openapi.py
```

### 8.2 Authentication (JWT)

Default credentials: **username** `admin`, **password** `admin` (overridable via env: `DEMO_USERNAME`, `DEMO_PASSWORD_HASH`).

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/login` | POST | Body: `{"username":"admin","password":"admin"}` → returns `access_token`, `refresh_token`, `user` |
| `/api/v1/auth/refresh` | POST | Body: `{"refresh_token":"..."}` → new token pair |
| `/api/v1/auth/me` | GET | Header: `Authorization: Bearer <access_token>` → current user |

Protected routes (e.g. recommendations) require the `Authorization: Bearer <access_token>` header.

### 8.3 All Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | No | Discovery: links to docs, health |
| GET | `/api/v1/health` | No | Health check: `{"status":"ok","version":"1.0.0"}` |
| POST | `/api/v1/auth/login` | No | Login (get tokens) |
| POST | `/api/v1/auth/refresh` | No | Refresh tokens |
| GET | `/api/v1/auth/me` | Bearer | Current user |
| POST | `/api/v1/recommendations` | Bearer | Top 3 recommendations + AI explanation |
| GET | `/api/v1/movies` | No | Paginated movie list (optional `search`, `mood`, `genre`; includes `poster_url`, `vote_average`) |
| GET | `/api/v1/movies/{film_id}` | No | Single movie detail (poster, overview, release_date) |
| GET | `/api/v1/catalog/options` | No | Options for UI: `moods`, `genres`, `styles` |

### 8.4 Recommendation Request Body

Get valid options for mood / genre / style from **`GET /api/v1/catalog/options`** so values align with the catalog.

| Field | Meaning | Valid / Notes |
|-------|--------|----------------|
| `description` | Free-text preference; tone, themes, what to avoid | Min 10 characters; used heavily for semantic match |
| `preferred_mood` | Atmosphere (e.g. dark, tense, uplifting) | Use `catalog/options` → `moods` |
| `preferred_genre` | Theme / genre (e.g. crime, science fiction) | Use `catalog/options` → `genres` |
| `preferred_style` | Pacing / style (e.g. mystery, action, drama) | Use `catalog/options` → `styles`; short keywords work best |
| `mood_intensity` | How strong the mood should be | **1** = subtle → **5** = central |
| `theme_interest` | How important theme is to the match | **1** = secondary → **5** = very important |
| `style_interest` | How important pacing/style is | **1** = matters little → **5** = very important |

Example request:

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

### 8.5 Recommendation Response Shape

Success responses use an envelope: `{ "data": { ... }, "meta": { ... } }`.

```json
{
  "data": {
    "recommendations": [
      {
        "film_id": 1,
        "title": "The Batman",
        "poster_url": "https://image.tmdb.org/t/p/original/74xTEgt7R36Fpooo50r9T25onhq.jpg",
        "coverage_score": 0.782,
        "mood_score": 0.891,
        "theme_score": 0.823,
        "style_score": 0.654,
        "desc_score": 0.712
      }
    ],
    "explanation": "These three films strongly match your preference for dark, crime-themed stories..."
  },
  "meta": {
    "timestamp": "2025-02-16T12:00:00.000000+00:00",
    "user_id": "1"
  }
}
```

### 8.6 Movies & Catalog (UI-Oriented)

- **`GET /api/v1/movies`**: Query params `skip`, `limit`, optional `search`, `mood`, `genre`. Each item includes `film_id`, `title`, `mood`, `theme`, `narrative_style`, `emotional_tone`, `poster_url`, `vote_average`.
- **`GET /api/v1/movies/{film_id}`**: Full detail including `description`, `overview`, `poster_url`, `release_date`, `vote_average`.
- **`GET /api/v1/catalog/options`**: Returns `{ "moods": [...], "genres": [...], "styles": [...] }` for dropdowns and recommendation form.

Poster URLs come from the raw dataset (`Database_Cleaned.csv`, `Poster_Url`); the movie catalog service merges referential and raw data by index.

### 8.7 Configuration (Environment)

| Variable | Purpose |
|----------|---------|
| `SECRET_KEY` | JWT signing key (set in production) |
| `DEMO_USERNAME` / `DEMO_PASSWORD_HASH` | Override default admin user (bcrypt hash for password) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` / `REFRESH_TOKEN_EXPIRE_DAYS` | Token expiry |
| `LLM_URL` / `LLM_MODEL` | Ollama endpoint and model (default: `http://localhost:11434/api/generate`, `phi3:mini`) |

Paths for data and embeddings are defined in `src.core.config` (e.g. `PROCESSED_DIR`, `EMBEDDINGS_DIR`, `DATA_DIR`).

---

## 9. Examples

### 9.1 Running the Offline Pipeline

```python
from src.preprocessing.referential_builder import create_referential
from src.embedding.embedding_builder import build_block_embeddings

# Step 1: Build referential
create_referential(
    input_path="data/raw/Database_Cleaned.csv",
    output_path="data/processed/movies_referential.csv"
)

# Step 2: Build embeddings
build_block_embeddings(
    referential_path="data/processed/movies_referential.csv",
    save_folder="models/embeddings/"
)
```

### 9.2 API Request (cURL)

**Login then recommendations:**

```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}' | jq -r '.access_token')

# 2. Get recommendations
curl -X POST http://localhost:8000/api/v1/recommendations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "description": "I want a dark emotional story with mystery",
    "preferred_mood": "dark",
    "preferred_genre": "crime",
    "preferred_style": "mystery",
    "mood_intensity": 5,
    "theme_interest": 4,
    "style_interest": 3
  }'
```

(On Windows PowerShell set `$TOKEN` from the login response manually.)

### 9.3 Python API Client

```python
import requests

BASE = "http://localhost:8000/api/v1"

# Login
r = requests.post(f"{BASE}/auth/login", json={"username": "admin", "password": "admin"})
r.raise_for_status()
token = r.json()["access_token"]

# Recommendations
r = requests.post(
    f"{BASE}/recommendations",
    headers={"Authorization": f"Bearer {token}"},
    json={
        "description": "Dark crime thriller with psychological depth",
        "preferred_mood": "dark",
        "preferred_genre": "crime",
        "preferred_style": "mystery",
        "mood_intensity": 5,
        "theme_interest": 4,
        "style_interest": 3,
    },
)
r.raise_for_status()
data = r.json()
print("Recommendations:", data["data"]["recommendations"])
print("Explanation:", data["data"]["explanation"])
```

**Catalog options and movies (no auth):**

```python
# Options for dropdowns
r = requests.get(f"{BASE}/catalog/options")
options = r.json()["data"]  # moods, genres, styles

# Paginated movie list with posters
r = requests.get(f"{BASE}/movies", params={"limit": 10, "mood": "dark"})
movies = r.json()["data"]["items"]

# Single movie detail
r = requests.get(f"{BASE}/movies/1")
movie = r.json()["data"]
```

### 9.4 Alternative RAG Pipeline Usage

```python
from src.movie_recommender.pipeline import MovieRecommenderPipeline

pipeline = MovieRecommenderPipeline(
    data_path="data/raw/Database_Cleaned.csv",
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    llm_url="http://localhost:11434/api/generate",
    llm_model="phi3:mini"
)

result = pipeline.recommend(
    user_input="I want a heartwarming family movie with magic",
    top_k=5
)
print(result["retrieved_movies"])
print(result["llm_response"])
```

### 9.5 Taxonomy Extraction Example

```
Overview: "Stranded at a rest stop during a blizzard, a woman discovers a kidnapped child..."
```

- **Mood**: `tense` (blizzard, kidnap, struggle)
- **Theme**: `survival` (stranded, blizzard), `family` (child)
- **Style**: `neutral` (no action/mystery/drama keywords)

---

## 10. Project Structure

```
EFREI-Project_AI-M1/
├── data/
│   ├── raw/
│   │   ├── Database.csv
│   │   └── Database_Cleaned.csv
│   └── processed/
│       └── movies_referential.csv
├── docs/
│   ├── openapi.json            # Static OpenAPI spec (generated)
│   └── openapi.yaml
├── models/
│   └── embeddings/
│       ├── mood_embeddings.npy
│       ├── theme_embeddings.npy
│       ├── style_embeddings.npy
│       └── desc_embeddings.npy
├── scripts/
│   └── generate_openapi.py    # Regenerate docs/openapi.json and .yaml
├── src/
│   ├── api/
│   │   ├── app.py              # FastAPI app, routers, OpenAPI config
│   │   ├── api.py              # Entry point (imports app)
│   │   ├── dependencies.py    # Auth, lazy encoder/scorer/LLM, catalog helpers
│   │   ├── routers/
│   │   │   ├── auth.py        # login, refresh, me
│   │   │   ├── catalog.py     # GET /catalog/options
│   │   │   ├── health.py      # GET /health
│   │   │   ├── movies.py     # GET /movies, GET /movies/{id}
│   │   │   └── recommendations.py  # POST /recommendations
│   │   └── schemas/
│   │       ├── auth.py        # LoginRequest, TokenPair, UserOut
│   │       ├── common.py      # ApiResponse, HealthResponse
│   │       ├── movies.py       # MovieListItem, MovieDetail, CatalogOptions
│   │       └── recommendations.py  # RecommendationRequest, MovieRecommendationItem
│   ├── config/
│   │   └── taxonomy.py         # Mood/theme/style keywords
│   ├── core/
│   │   ├── config.py          # Paths, JWT/LLM env settings
│   │   ├── security.py        # JWT create/decode, bcrypt password hash
│   │   └── auth_user.py       # Demo user lookup (no DB)
│   ├── embedding/
│   │   ├── sbert_loader.py
│   │   └── embedding_builder.py
│   ├── genAi/
│   │   ├── llm_client.py
│   │   └── prompt_builder.py
│   ├── movie_recommender/
│   │   └── pipeline.py         # Alternative RAG pipeline
│   ├── preprocessing/
│   │   ├── block_builder.py
│   │   └── referential_builder.py
│   ├── recommendation/
│   │   └── recommender.py      # Top-3 selection (includes FilmID)
│   ├── scoring/
│   │   └── coverage_scorer.py  # Uses core.config paths
│   ├── services/
│   │   └── movie_catalog.py    # Referential + raw merge, poster URLs
│   ├── user_profile/
│   │   ├── profile_encoder.py
│   │   └── questionnaire_schema.py
│   ├── visualization/
│   │   └── radar_plot.py
│   └── main.py                 # Uvicorn entry point
├── execute/
│   └── main_step_1.py
├── ipynb/
│   └── ...
├── requirement.txt
├── README.md
├── .env.example
└── PROJECT_DOCUMENTATION.md    # This file
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| fastapi | REST API framework |
| uvicorn | ASGI server |
| pandas | Data handling |
| numpy | Numerical operations |
| scikit-learn | Cosine similarity |
| sentence-transformers | SBERT embeddings |
| torch | PyTorch (SBERT backend) |
| requests | HTTP (Ollama API) |
| python-jose[cryptography] | JWT create/decode |
| bcrypt | Password hashing (replaces passlib for compatibility) |
| matplotlib | Radar charts (`radar_plot.py`) |
| streamlit | Streamlit UI (in `execute/main_step_1.py`) |

> **Note:** `pydantic` is included with FastAPI. PyTorch may be installed as `torch` or `torch+cpu` depending on your setup. Optional: `pyyaml` for generating `docs/openapi.yaml` via `scripts/generate_openapi.py`.

---

## Prerequisites

1. **Python**: 3.8+ with packages from `requirement.txt`
2. **Ollama**: Installed and running (`ollama run phi3`) for GenAI explanations
3. **Precomputed embeddings**: Run the offline pipeline before using the API
4. **Working directory**: Run from project root (paths resolved via `src.core.config`)
5. **Default API user**: `admin` / `admin` (override with `DEMO_USERNAME`, `DEMO_PASSWORD_HASH` in production)

---

*Documentation generated for EFREI AI M1 Project*
