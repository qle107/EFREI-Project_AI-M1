from fastapi import FastAPI
from pydantic import BaseModel
from src.user_profile.profile_encoder import UserProfileEncoder
from src.user_profile.questionnaire_schema import UserQuestionnaire
from src.scoring.coverage_scorer import CoverageScorer
from src.recommendation.recommender import RecommendationEngine
from src.genAi.prompt_builder import build_aisca_prompt
from src.genAi.llm_client import LLMClient

app = FastAPI(
    title="AISCA Semantic Movie Recommender API",
    version="1.0.0"
)

# Initialize pipeline components once
encoder = UserProfileEncoder()
scorer = CoverageScorer()
llm_client = LLMClient()


class RecommendationRequest(BaseModel):
    description: str
    preferred_mood: str
    preferred_genre: str
    preferred_style: str
    mood_intensity: int
    theme_interest: int
    style_interest: int


@app.get("/")
def health():
    return {"status": "API running"}


@app.post("/recommend")
def recommend(req: RecommendationRequest):

    # 1️⃣ Encode user profile
    user_profile = encoder.encode_profile(req)

    # 2️⃣ Compute coverage scores
    scored_movies = scorer.compute_score(user_profile)

    # 3️⃣ Get Top-3 recommendations
    engine = RecommendationEngine(scored_movies)
    top3 = engine.get_top3()

    # 4️⃣ Build prompt and call GenAI (ONE call only)
    prompt = build_aisca_prompt(req, top3)
    explanation = llm_client.generate(prompt)

    # 5️⃣ Return structured JSON
    return {
        "top3": top3,
        "genai_explanation": explanation
    }
