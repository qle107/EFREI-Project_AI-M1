from src.embedding.sbert_loader import load_sbert_model


class UserProfileEncoder:

    def __init__(self):
        self.model = load_sbert_model()

    def build_profile_blocks(self, questionnaire):
        mood_block = (
            f"The user wants a {questionnaire.preferred_mood} mood "
            f"with intensity level {questionnaire.mood_intensity}"
        )

        theme_block = (
            f"The user prefers {questionnaire.preferred_genre} themes "
            f"with interest level {questionnaire.theme_interest}"
        )

        style_block = (
            f"The user enjoys {questionnaire.preferred_style} narrative pacing "
            f"with interest level {questionnaire.style_interest}"
        )

        desc_parts = [questionnaire.description]
        if getattr(questionnaire, "preferred_era", None):
            desc_parts.append(f"The user prefers movies from the {questionnaire.preferred_era} era.")
        if getattr(questionnaire, "preferred_director", None):
            desc_parts.append(
                f"The user likes films in the style of {questionnaire.preferred_director}."
            )
        desc_block = " ".join(desc_parts)

        return {
            "mood": mood_block,
            "theme": theme_block,
            "style": style_block,
            "description": desc_block,
        }

    def encode_profile(self, questionnaire):
        blocks = self.build_profile_blocks(questionnaire)
        profile_embeddings = {
            k: self.model.encode(v, convert_to_numpy=True)
            for k, v in blocks.items()
        }
        return profile_embeddings
