import numpy as np
import pandas as pd
from datetime import date
from sklearn.metrics.pairwise import cosine_similarity
from src.core.config import EMBEDDINGS_DIR, PROCESSED_DIR


class CoverageScorer:
    RECENCY_WEIGHT = 0.05
    SEMANTIC_WEIGHT_BUDGET = 0.95
    DESCRIPTION_BASE_PRIORITY = 2.4
    MOOD_BASE_PRIORITY = 0.5
    THEME_BASE_PRIORITY = 0.5
    STYLE_BASE_PRIORITY = 0.4
    SLIDER_STEP = 0.3

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

    @staticmethod
    def _slider_value(questionnaire, field_name, default=3):
        if questionnaire is None:
            return default
        value = getattr(questionnaire, field_name, default)
        return max(1, min(5, int(value)))

    def compute_axis_weights(self, questionnaire=None):
        """Build dynamic weights from the questionnaire sliders."""
        mood_interest = self._slider_value(questionnaire, "mood_intensity")
        theme_interest = self._slider_value(questionnaire, "theme_interest")
        style_interest = self._slider_value(questionnaire, "style_interest")

        priorities = {
            "mood": self.MOOD_BASE_PRIORITY + self.SLIDER_STEP * mood_interest,
            "theme": self.THEME_BASE_PRIORITY + self.SLIDER_STEP * theme_interest,
            "style": self.STYLE_BASE_PRIORITY + self.SLIDER_STEP * style_interest,
            # Keep description strong so presets do not get dominated by one axis.
            "description": self.DESCRIPTION_BASE_PRIORITY,
        }

        total_priority = sum(priorities.values())
        semantic_weights = {
            axis: self.SEMANTIC_WEIGHT_BUDGET * priority / total_priority
            for axis, priority in priorities.items()
        }
        semantic_weights["recency"] = self.RECENCY_WEIGHT
        return semantic_weights

    def compute_raw_similarities(self, user_profile):
        """Compute cosine similarities before any normalization."""
        return {
            "mood": cosine_similarity(
                [user_profile["mood"]],
                self.mood_emb
            )[0],
            "theme": cosine_similarity(
                [user_profile["theme"]],
                self.theme_emb
            )[0],
            "style": cosine_similarity(
                [user_profile["style"]],
                self.style_emb
            )[0],
            "description": cosine_similarity(
                [user_profile["description"]],
                self.desc_emb
            )[0],
        }

    # Compute Recency Score
    def compute_recency_score(self):
        year = self.df["release_year"].fillna(2000)

        recency_score = np.exp(
            -(self.current_year - year) / 10
        )

        return recency_score

    # MAIN SCORING FUNCTION
    def compute_score(self, user_profile, questionnaire=None):

        # Compare USER vs MOVIES
        raw_sim = self.compute_raw_similarities(user_profile)
        weights = self.compute_axis_weights(questionnaire)

        # Keep raw cosine similarities for explanation/debug preview only.
        self.df["RawMoodSimilarity"] = raw_sim["mood"]
        self.df["RawThemeSimilarity"] = raw_sim["theme"]
        self.df["RawStyleSimilarity"] = raw_sim["style"]
        self.df["RawDescSimilarity"] = raw_sim["description"]

        mood_sim = self.normalize(raw_sim["mood"])
        theme_sim = self.normalize(raw_sim["theme"])
        style_sim = self.normalize(raw_sim["style"])
        desc_sim = self.normalize(raw_sim["description"])

        recency_score = self.compute_recency_score()

        self.df["MoodScore"] = mood_sim
        self.df["ThemeScore"] = theme_sim
        self.df["StyleScore"] = style_sim
        self.df["DescScore"] = desc_sim
        self.df["RecencyScore"] = recency_score

        # CineWatch weighted score: sliders shape mood/theme/style, description stays strong,
        # and recency remains a light tiebreaker.
        final_score = (
                weights["mood"] * mood_sim +
                weights["theme"] * theme_sim +
                weights["style"] * style_sim +
                weights["description"] * desc_sim +
                weights["recency"] * recency_score
        )

        self.df["CoverageScore"] = final_score

        # Top 3 recommendation
        return self.df.sort_values(
            by="CoverageScore",
            ascending=False
        ).head(3)
