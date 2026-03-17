"""
Preset recommendation queries with pre-cached GenAI results.

The first time a preset is requested, the full pipeline runs and the LLM
response is cached.  Subsequent requests for the same preset return
instantly from the in-memory cache.

This satisfies:
- Annexe I 1.5.3  (responsible, cost-aware GenAI usage)
- Annexe I 2.6    (industrialise: performance, cost constraints)
"""
from __future__ import annotations

PRESET_QUERIES: list[dict] = [
    {
        "id": "dark-crime-thriller",
        "label": "Dark Crime Thriller",
        "description": "I want a dark, gritty crime thriller with moral ambiguity, tension, and a noir atmosphere. Complex characters and a gripping narrative.",
        "preferred_mood": "dark",
        "preferred_genre": "crime",
        "preferred_style": "mystery",
        "mood_intensity": 5,
        "theme_interest": 5,
        "style_interest": 4,
    },
    {
        "id": "feel-good-family",
        "label": "Feel-Good Family Adventure",
        "description": "A heartwarming family adventure with humour, uplifting moments, and beautiful visuals. Something the whole family can enjoy together.",
        "preferred_mood": "uplifting",
        "preferred_genre": "family",
        "preferred_style": "action",
        "mood_intensity": 3,
        "theme_interest": 4,
        "style_interest": 3,
    },
    {
        "id": "sci-fi-mind-bending",
        "label": "Mind-Bending Sci-Fi",
        "description": "A cerebral science fiction film that plays with time, reality, or artificial intelligence. Smart dialogue, tense atmosphere, and a twist ending.",
        "preferred_mood": "tense",
        "preferred_genre": "science fiction",
        "preferred_style": "mystery",
        "mood_intensity": 4,
        "theme_interest": 5,
        "style_interest": 5,
    },
    {
        "id": "epic-fantasy",
        "label": "Epic Fantasy Quest",
        "description": "An epic fantasy adventure with world-building, heroic journeys, mythical creatures, and sweeping battles. Grand scale and memorable characters.",
        "preferred_mood": "heroic",
        "preferred_genre": "fantasy",
        "preferred_style": "action",
        "mood_intensity": 4,
        "theme_interest": 5,
        "style_interest": 4,
    },
    {
        "id": "romantic-drama",
        "label": "Emotional Romantic Drama",
        "description": "A deeply emotional romantic drama with nuanced characters, beautiful cinematography, and a story that stays with you. Bittersweet, not cheesy.",
        "preferred_mood": "melancholic",
        "preferred_genre": "drama",
        "preferred_style": "drama",
        "mood_intensity": 5,
        "theme_interest": 4,
        "style_interest": 3,
    },
    {
        "id": "horror-suspense",
        "label": "Psychological Horror",
        "description": "A slow-burn psychological horror film that builds dread through atmosphere rather than jump scares. Unsettling, eerie, and thought-provoking.",
        "preferred_mood": "dark",
        "preferred_genre": "thriller",
        "preferred_style": "mystery",
        "mood_intensity": 5,
        "theme_interest": 4,
        "style_interest": 5,
    },
]


def get_preset_by_id(preset_id: str) -> dict | None:
    for p in PRESET_QUERIES:
        if p["id"] == preset_id:
            return p
    return None
