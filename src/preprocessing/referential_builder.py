import pandas as pd
from src.preprocessing.block_builder import build_semantic_blocks


def create_referential(
    input_path,
    output_path
):

    df = pd.read_csv(input_path)

    df = build_semantic_blocks(df)

    df["FilmID"] = df.index

    df = df[[
        "release_year",
        "FilmID",
        "Title",
        "Mood",
        "Theme",
        "NarrativeStyle",
        "EmotionalTone",
        "Description"
    ]]

    df.to_csv(output_path, index=False)

    print("AISCA Referential Created ✔")
