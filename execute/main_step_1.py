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


# user_input = UserQuestionnaire(
#     description="I want a dark emotional story with mystery",
#     preferred_mood="tense",
#     preferred_genre="crime",
#     preferred_style="action",
#     mood_intensity=5,
#     theme_interest=4,
#     style_interest=3
#
# )
#
# encoder = UserProfileEncoder()
#
# user_profile = encoder.encode_profile(user_input)
#
# scorer = CoverageScorer()
#
# top_movies = scorer.compute_score(user_profile)
#
# print(top_movies[["Title", "CoverageScore"]])

# from src.user_profile.profile_encoder import UserProfileEncoder
# from src.user_profile.questionnaire_schema import UserQuestionnaire
# from src.scoring.coverage_scorer import CoverageScorer
# from src.recommendation.recommender import RecommendationEngine
#
#
# # Hybrid User Input
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
# # Encode Profile
# encoder = UserProfileEncoder()
# user_profile = encoder.encode_profile(user_input)
#
# # Compute Coverage
# scorer = CoverageScorer()
# scored_movies = scorer.compute_score(user_profile)
#
# # Recommend Top 3
# engine = RecommendationEngine(scored_movies)
# top3 = engine.get_top3()
#
# print("\nTOP 3 RECOMMENDATIONS:\n")
#
# for rec in top3:
#     print(rec)

from src.user_profile.profile_encoder import UserProfileEncoder
from src.user_profile.questionnaire_schema import UserQuestionnaire
from src.scoring.coverage_scorer import CoverageScorer
from src.recommendation.recommender import RecommendationEngine
from src.genAi.prompt_builder import build_aisca_prompt
from src.genAi.llm_client import LLMClient

# Run ollama run phi3 in cmd to start local LLM server

# User Input
user_input = UserQuestionnaire(
    description="I want a dark emotional story with mystery",
    preferred_mood="dark",
    preferred_genre="crime",
    preferred_style="slow",
    mood_intensity=5,
    theme_interest=4,
    style_interest=3
)

# Profile Encoding
encoder = UserProfileEncoder()
user_profile = encoder.encode_profile(user_input)

# Coverage Scoring
scorer = CoverageScorer()
scored_movies = scorer.compute_score(user_profile)

# Top 3 Recommendation
engine = RecommendationEngine(scored_movies)
top3 = engine.get_top3()

# AISCA Prompt
prompt = build_aisca_prompt(user_input, top3)

# ONE LLM CALL
llm = LLMClient()
explanation = llm.generate(prompt)

print("\nGENAI EXPLANATION:\n")
print(explanation)

