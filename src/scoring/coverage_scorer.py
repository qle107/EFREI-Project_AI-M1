import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity


class CoverageScorer:

    def __init__(self):

        # Load movie embeddings from Step 2
        self.mood_emb = np.load("models/embeddings/mood_embeddings.npy")
        self.theme_emb = np.load("models/embeddings/theme_embeddings.npy")
        self.style_emb = np.load("models/embeddings/style_embeddings.npy")
        self.desc_emb = np.load("models/embeddings/desc_embeddings.npy")

        # Load referential
        self.df = pd.read_csv(
            "data/processed/movies_referential.csv"
        )

    def compute_score(self, user_profile):

        # Compare USER vs MOVIES

        mood_sim = cosine_similarity(
            [user_profile["mood"]],
            self.mood_emb
        )[0]

        theme_sim = cosine_similarity(
            [user_profile["theme"]],
            self.theme_emb
        )[0]

        style_sim = cosine_similarity(
            [user_profile["style"]],
            self.style_emb
        )[0]

        desc_sim = cosine_similarity(
            [user_profile["description"]],
            self.desc_emb
        )[0]

        # Debug: Print similarity scores
        self.df["MoodScore"] = mood_sim
        self.df["ThemeScore"] = theme_sim
        self.df["StyleScore"] = style_sim
        self.df["DescScore"] = desc_sim


        # AISCA Weighted Score
        final_score = (
            0.35 * mood_sim +
            0.25 * theme_sim +
            0.20 * style_sim +
            0.20 * desc_sim
        )

        self.df["CoverageScore"] = final_score

        # Top 3 recommendation
        return self.df.sort_values(
            by="CoverageScore",
            ascending=False
        ).head(3)
