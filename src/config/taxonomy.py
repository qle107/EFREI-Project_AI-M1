"""
Taxonomy: keywords for embedding + extended options for UI.
"""

MOOD_KEYWORDS = {
    "dark": ["crime", "killer", "murder", "corruption"],
    "uplifting": ["family", "gift", "hope"],
    "tense": ["struggle", "danger", "kidnap", "blizzard"],
    "heroic": ["hero", "super", "fight"],
}

THEME_KEYWORDS = {
    "fantasy": ["magic", "gift", "power"],
    "crime": ["killer", "corruption"],
    "survival": ["stranded", "blizzard"],
    "family": ["family", "child"],
}

STYLE_KEYWORDS = {
    "action": ["fight", "danger"],
    "mystery": ["discover", "uncovers"],
    "drama": ["family", "life"],
}

# Extended options for UI — merged with catalog data for richer selection
EXTENDED_MOODS = [
    "dark",
    "uplifting",
    "tense",
    "heroic",
    "romantic",
    "melancholic",
    "hopeful",
    "gritty",
    "atmospheric",
    "suspenseful",
    "lighthearted",
    "intense",
    "nostalgic",
    "bittersweet",
    "mysterious",
    "epic",
    "cozy",
    "neutral",
]

EXTENDED_GENRES = [
    "action",
    "adventure",
    "animation",
    "comedy",
    "crime",
    "drama",
    "fantasy",
    "family",
    "horror",
    "mystery",
    "romance",
    "science fiction",
    "thriller",
    "war",
    "western",
    "music",
    "documentary",
    "history",
]

EXTENDED_STYLES = [
    "action",
    "drama",
    "mystery",
    "comedy",
    "thriller",
    "romance",
    "slow-burn",
    "fast-paced",
    "character-driven",
    "plot-driven",
    "noir",
    "experimental",
    "neutral",
]
