import numpy as np
import pandas as pd
from src.embedding.sbert_loader import load_sbert_model


def build_block_embeddings(
    referential_path,
    save_folder="models/embeddings/"
):

    df = pd.read_csv(referential_path)

    model = load_sbert_model()

    print("Encoding Mood...")
    mood_embeddings = model.encode(
        df["Mood"].tolist(),
        convert_to_numpy=True,
        show_progress_bar=True
    )

    print("Encoding Theme...")
    theme_embeddings = model.encode(
        df["Theme"].tolist(),
        convert_to_numpy=True,
        show_progress_bar=True
    )

    print("Encoding Narrative Style...")
    style_embeddings = model.encode(
        df["NarrativeStyle"].tolist(),
        convert_to_numpy=True,
        show_progress_bar=True
    )

    print("Encoding Description...")
    desc_embeddings = model.encode(
        df["Description"].tolist(),
        convert_to_numpy=True,
        show_progress_bar=True
    )

    np.save(save_folder + "mood_embeddings.npy", mood_embeddings)
    np.save(save_folder + "theme_embeddings.npy", theme_embeddings)
    np.save(save_folder + "style_embeddings.npy", style_embeddings)
    np.save(save_folder + "desc_embeddings.npy", desc_embeddings)

    print("All embeddings saved ✔")
