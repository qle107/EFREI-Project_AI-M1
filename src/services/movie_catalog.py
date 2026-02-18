"""
Movie catalog: referential + raw data merged for poster URLs and extra fields.
Lazy-loaded singleton for use in API.
"""
import pandas as pd

from src.core.config import PROCESSED_DIR, DATA_DIR

_raw_df: pd.DataFrame | None = None
_ref_df: pd.DataFrame | None = None
_merged_df: pd.DataFrame | None = None


def _load_catalog() -> pd.DataFrame:
    global _merged_df, _ref_df, _raw_df
    if _merged_df is not None:
        return _merged_df

    ref_path = PROCESSED_DIR / "movies_referential.csv"
    raw_path = DATA_DIR / "raw" / "Database_Cleaned.csv"

    _ref_df = pd.read_csv(ref_path)
    _ref_df = _ref_df.astype({"FilmID": "int"})

    if raw_path.exists():
        _raw_df = pd.read_csv(raw_path)
        # Align by index: FilmID in referential was raw.index at build time
        poster_lookup = {}
        for i, row in _raw_df.iterrows():
            if isinstance(i, int) and i < len(_ref_df):
                poster_lookup[i] = {
                    "Poster_Url": row.get("Poster_Url") or None,
                    "Release_Date": row.get("Release_Date") if pd.notna(row.get("Release_Date")) else None,
                    "Vote_Average": float(row["Vote_Average"]) if pd.notna(row.get("Vote_Average")) else None,
                    "Overview": str(row["Overview"]) if pd.notna(row.get("Overview")) else "",
                }
        _ref_df["Poster_Url"] = _ref_df["FilmID"].map(lambda x: poster_lookup.get(x, {}).get("Poster_Url"))
        _ref_df["Release_Date"] = _ref_df["FilmID"].map(lambda x: poster_lookup.get(x, {}).get("Release_Date"))
        _ref_df["Vote_Average"] = _ref_df["FilmID"].map(lambda x: poster_lookup.get(x, {}).get("Vote_Average"))
        _ref_df["Overview"] = _ref_df["FilmID"].map(lambda x: poster_lookup.get(x, {}).get("Overview") or "")
    else:
        _ref_df["Poster_Url"] = None
        _ref_df["Release_Date"] = None
        _ref_df["Vote_Average"] = None
        _ref_df["Overview"] = _ref_df.get("Description", "")

    _merged_df = _ref_df
    return _merged_df


def get_catalog_df() -> pd.DataFrame:
    return _load_catalog()


def get_movie_by_id(film_id: int) -> dict | None:
    df = get_catalog_df()
    row = df[df["FilmID"] == film_id]
    if row.empty:
        return None
    r = row.iloc[0]
    return {
        "film_id": int(r["FilmID"]),
        "title": str(r["Title"]),
        "mood": str(r["Mood"]),
        "theme": str(r["Theme"]),
        "narrative_style": str(r["NarrativeStyle"]),
        "emotional_tone": str(r["EmotionalTone"]),
        "description": str(r["Description"]),
        "poster_url": r.get("Poster_Url") if pd.notna(r.get("Poster_Url")) else None,
        "release_date": r.get("Release_Date") if pd.notna(r.get("Release_Date")) else None,
        "vote_average": float(r["Vote_Average"]) if r.get("Vote_Average") is not None and pd.notna(r.get("Vote_Average")) else None,
        "overview": str(r.get("Overview") or r["Description"]),
    }


def get_movies_page(
    skip: int = 0,
    limit: int = 20,
    search: str | None = None,
    mood: str | None = None,
    genre: str | None = None,
) -> tuple[list[dict], int]:
    df = get_catalog_df()
    total = len(df)

    if search:
        q = search.lower().strip()
        mask = df["Title"].str.lower().str.contains(q, na=False) | df["Description"].str.lower().str.contains(q, na=False)
        df = df[mask]
    if mood:
        mask = df["Mood"].str.lower().str.contains(mood.lower(), na=False)
        df = df[mask]
    if genre:
        mask = df["EmotionalTone"].str.lower().str.contains(genre.lower(), na=False)
        df = df[mask]

    total_filtered = len(df)
    df = df.iloc[skip : skip + limit]

    rows = []
    for _, r in df.iterrows():
        rows.append({
            "film_id": int(r["FilmID"]),
            "title": str(r["Title"]),
            "mood": str(r["Mood"]),
            "theme": str(r["Theme"]),
            "narrative_style": str(r["NarrativeStyle"]),
            "emotional_tone": str(r["EmotionalTone"]),
            "poster_url": r.get("Poster_Url") if pd.notna(r.get("Poster_Url")) else None,
            "vote_average": float(r["Vote_Average"]) if r.get("Vote_Average") is not None and pd.notna(r.get("Vote_Average")) else None,
        })
    return rows, total_filtered


def get_poster_url_for_film_id(film_id: int) -> str | None:
    df = get_catalog_df()
    row = df[df["FilmID"] == film_id]
    if row.empty:
        return None
    v = row.iloc[0].get("Poster_Url")
    return None if pd.isna(v) or not v else str(v)
