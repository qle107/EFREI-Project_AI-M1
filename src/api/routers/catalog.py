"""
Catalog options for UI dropdowns (moods, genres, styles).
Merges data-derived values with extended taxonomy for richer selection.
"""
from fastapi import APIRouter

from src.api.schemas.common import ApiResponse
from src.api.schemas.movies import CatalogOptions
from src.config.taxonomy import EXTENDED_MOODS, EXTENDED_GENRES, EXTENDED_STYLES
from src.services.movie_catalog import get_catalog_df

router = APIRouter(prefix="/catalog", tags=["Catalog"])


def _unique_sorted(values: list) -> list[str]:
    seen = set()
    out = []
    for v in values:
        if v is None or (isinstance(v, float) and str(v) == "nan") or not str(v).strip():
            continue
        for part in str(v).split(","):
            x = part.strip().lower()
            if x and x != "neutral" and x not in seen:
                seen.add(x)
                out.append(part.strip())
    return sorted(out)


def _merge_with_extended(data_values: list[str], extended: list[str]) -> list[str]:
    """Merge catalog values with extended taxonomy; dedupe and sort."""
    seen = set()
    out = []
    for v in data_values:
        x = v.lower().strip()
        if x and x not in seen:
            seen.add(x)
            out.append(v)
    for v in extended:
        x = v.lower().strip()
        if x and x not in seen:
            seen.add(x)
            out.append(v)
    return sorted(out, key=str.lower)


@router.get(
    "/options",
    response_model=ApiResponse[CatalogOptions],
    summary="Get filter options",
    description="Returns unique moods, genres, and styles for UI (merged with extended taxonomy).",
)
def get_catalog_options() -> ApiResponse[CatalogOptions]:
    df = get_catalog_df()
    data_moods = _unique_sorted(df["Mood"].dropna().astype(str).tolist())
    data_genres = _unique_sorted(df["EmotionalTone"].dropna().astype(str).tolist())
    data_styles = _unique_sorted(df["NarrativeStyle"].dropna().astype(str).tolist())

    moods = _merge_with_extended(data_moods, EXTENDED_MOODS)
    genres = _merge_with_extended(data_genres, EXTENDED_GENRES)
    styles = _merge_with_extended(data_styles, EXTENDED_STYLES)

    return ApiResponse(
        data=CatalogOptions(moods=moods, genres=genres, styles=styles),
        meta={},
    )
