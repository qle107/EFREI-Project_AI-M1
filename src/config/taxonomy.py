"""
Taxonomy: keywords for embedding + extended options for UI.
"""

MOOD_KEYWORDS = {
    "dark": ["crime", "killer", "murder", "corruption", "noir", "bleak", "grim", "violence", "deadly", "revenge", "blood"],
    "uplifting": ["family", "gift", "hope", "inspiration", "triumph", "joy", "heartwarming", "dream"],
    "tense": ["struggle", "danger", "kidnap", "blizzard", "suspense", "chase", "escape", "threat", "hostage"],
    "heroic": ["hero", "super", "fight", "courage", "sacrifice", "rescue", "victory", "battle"],
    "romantic": ["love", "romance", "passion", "heart", "relationship", "couple"],
    "melancholic": ["loss", "grief", "sorrow", "death", "tragedy", "lonely", "regret"],
    "hopeful": ["hope", "dream", "wish", "future", "believe"],
    "gritty": ["gritty", "rough", "urban", "streets", "underworld"],
    "atmospheric": ["atmosphere", "mood", "eerie", "haunting"],
    "suspenseful": ["suspense", "tension", "thriller", "cliffhanger"],
    "lighthearted": ["comedy", "fun", "laugh", "cheerful", "humor", "witty"],
    "intense": ["intense", "violent", "brutal", "relentless"],
    "mysterious": ["mystery", "discover", "uncover", "secret", "clue", "investigation"],
    "epic": ["epic", "battle", "war", "journey", "quest", "legend"],
}

THEME_KEYWORDS = {
    "fantasy": ["magic", "gift", "power", "dragon", "kingdom", "mythical", "wizard", "enchanted"],
    "crime": ["killer", "corruption", "murder", "robbery", "detective", "heist", "gangster"],
    "survival": ["stranded", "blizzard", "island", "desert", "wilderness", "trapped"],
    "family": ["family", "child", "parent", "children", "mother", "father"],
    "adventure": ["journey", "quest", "treasure", "exploration", "expedition"],
    "horror": ["haunted", "ghost", "monster", "terror", "nightmare", "supernatural"],
    "romance": ["love", "romance", "relationship", "wedding"],
    "war": ["war", "battle", "soldier", "military", "combat"],
    "science fiction": ["space", "future", "robot", "alien", "time travel", "dystopia"],
}

STYLE_KEYWORDS = {
    "action": ["fight", "danger", "chase", "explosion", "stunt", "combat"],
    "mystery": ["discover", "uncovers", "detective", "clue", "investigation", "solve"],
    "drama": ["family", "life", "death", "relationship", "emotional"],
    "comedy": ["laugh", "funny", "humor", "comedy", "wit"],
    "thriller": ["suspense", "tension", "thriller", "edge"],
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
