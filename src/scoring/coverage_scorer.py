import numpy as np
import pandas as pd
from datetime import date
from sklearn.metrics.pairwise import cosine_similarity
from src.core.config import EMBEDDINGS_DIR, PROCESSED_DIR


class CoverageScorer:

    def __init__(self):
        # Load movie embeddings from Step 2
        self.mood_emb = np.load(EMBEDDINGS_DIR / "mood_embeddings.npy")
        self.theme_emb = np.load(EMBEDDINGS_DIR / "theme_embeddings.npy")
        self.style_emb = np.load(EMBEDDINGS_DIR / "style_embeddings.npy")
        self.desc_emb = np.load(EMBEDDINGS_DIR / "desc_embeddings.npy")

        # Load referential
        self.df = pd.read_csv(PROCESSED_DIR / "movies_referential.csv")

        self.current_year = date.today().year

    # Normalize similarity function
    def normalize(self, sim):
        return (sim - sim.min()) / (sim.max() - sim.min() + 1e-8)

    # Compute Recency Score
    def compute_recency_score(self):
        year = self.df["release_year"].fillna(2000)

        recency_score = np.exp(
            -(self.current_year - year) / 10
        )

        return recency_score

    # MAIN SCORING FUNCTION
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

        mood_sim = self.normalize(mood_sim)
        theme_sim = self.normalize(theme_sim)
        style_sim = self.normalize(style_sim)
        desc_sim = self.normalize(desc_sim)

        recency_score = self.compute_recency_score()

        self.df["MoodScore"] = mood_sim
        self.df["ThemeScore"] = theme_sim
        self.df["StyleScore"] = style_sim
        self.df["DescScore"] = desc_sim
        self.df["RecencyScore"] = recency_score

        # AISCA Weighted Score: semantic blocks dominate (95%), recency is a light tiebreaker (5%)
        final_score = (
                0.35 * mood_sim +
                0.25 * theme_sim +
                0.20 * style_sim +
                0.15 * desc_sim +
                0.05 * recency_score
        )

        self.df["CoverageScore"] = final_score

        # Top 3 recommendation
        return self.df.sort_values(
            by="CoverageScore",
            ascending=False
        ).head(3)
