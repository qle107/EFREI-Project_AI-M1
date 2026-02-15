import re
import pandas as pd
from src.config.taxonomy import (
    MOOD_KEYWORDS,
    THEME_KEYWORDS,
    STYLE_KEYWORDS
)


def clean_text(text):

    # Handle NaN / float values
    if pd.isna(text):
        return ""

    return str(text).lower()


def extract_block(text, taxonomy):

    text = clean_text(text)

    detected = []

    for label, keywords in taxonomy.items():
        for word in keywords:
            if re.search(rf"\b{word}\b", text):
                detected.append(label)
                break

    return ", ".join(detected) if detected else "neutral"


def build_semantic_blocks(df):

    # Ensure no NaN before semantic processing
    df["Overview"] = df["Overview"].fillna("")
    df["Genre"] = df["Genre"].fillna("")

    df["Mood"] = df["Overview"].apply(
        lambda x: extract_block(x, MOOD_KEYWORDS)
    )

    df["Theme"] = df["Overview"].apply(
        lambda x: extract_block(x, THEME_KEYWORDS)
    )

    df["NarrativeStyle"] = df["Overview"].apply(
        lambda x: extract_block(x, STYLE_KEYWORDS)
    )

    df["EmotionalTone"] = df["Genre"]

    df["Description"] = (
        df["Overview"] +
        " Genre: " +
        df["Genre"]
    )

    return df
