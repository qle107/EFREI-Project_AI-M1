from src.preprocessing.referential_builder import create_referential
from src.embedding.embedding_builder import build_block_embeddings
from src.user_profile.profile_encoder import UserProfileEncoder
from src.user_profile.questionnaire_schema import UserQuestionnaire
from src.user_profile.profile_encoder import UserProfileEncoder
from src.user_profile.questionnaire_schema import UserQuestionnaire
from src.scoring.coverage_scorer import CoverageScorer




# ---

#
# create_referential(
#     input_path="data/raw/Database_Cleaned.csv",
#     output_path="data/processed/movies_referential.csv"
# )
# ---

# build_block_embeddings(
#     referential_path="data/processed/movies_referential.csv"
# )
# ---
# user_input = UserQuestionnaire(
#     description="I want a dark emotional story with mystery",
#     preferred_mood="dark",
#     preferred_genre="crime",
#     preferred_style="slow",
#     mood_intensity=5,
#     theme_interest=4,
#     style_interest=3
# )
#
# encoder = UserProfileEncoder()
#
# profile = encoder.encode_profile(user_input)
#
# print("User profile embeddings created ✔")
# ---

user_input = UserQuestionnaire(
    description="I want a dark emotional story with mystery",
    preferred_mood="tense",
    preferred_genre="crime",
    preferred_style="action",
    mood_intensity=5,
    theme_interest=4,
    style_interest=3

)

encoder = UserProfileEncoder()

user_profile = encoder.encode_profile(user_input)

scorer = CoverageScorer()

top_movies = scorer.compute_score(user_profile)

print(top_movies[["Title", "CoverageScore"]])

