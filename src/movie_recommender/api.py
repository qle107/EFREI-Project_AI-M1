# api.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .pipeline import MovieRecommenderPipeline

app = FastAPI(
    title="Semantic Movie Recommender API",
    version="1.0.0"
)

# Initialize pipeline once at startup
pipeline = MovieRecommenderPipeline(
    data_path="data/Database_Cleaned.csv"
)


# ---------------------------
# Request Schema
# ---------------------------
class RecommendationRequest(BaseModel):
    query: str
    top_k: int = 5


# ---------------------------
# Health Check
# ---------------------------
@app.get("/")
def health():
    return {"status": "API running"}


# ---------------------------
# Recommendation Endpoint
# ---------------------------
@app.post("/recommend")
def recommend(request: RecommendationRequest):
    try:
        result = pipeline.recommend(
            user_input=request.query,
            top_k=request.top_k
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
