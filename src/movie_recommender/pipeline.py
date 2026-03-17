import os
import requests
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


class MovieRecommenderPipeline:
    def __init__(
        self,
        data_path: str,
        model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        llm_url: str = "http://localhost:11434/api/generate",
        llm_model: str = "phi3:mini",
    ):
        self.data_path = data_path
        self.model_name = model_name
        self.llm_url = llm_url
        self.llm_model = llm_model

        self._load_data()
        self._load_embedding_model()
        self._build_embeddings()

    # ---------------------------
    # Data Loading
    # ---------------------------
    def _load_data(self):
        self.df = pd.read_csv(self.data_path)

        self.df["combined_features"] = (
            self.df["Title"].fillna("") + ". "
            + self.df["Overview"].fillna("") + ". Genres: "
            + self.df["Genre"].fillna("")
        )

    # ---------------------------
    # Embedding Model
    # ---------------------------
    def _load_embedding_model(self):
        self.model = SentenceTransformer(self.model_name)

    def _build_embeddings(self):
        self.corpus_embeddings = self.model.encode(
            self.df["combined_features"].tolist(),
            convert_to_numpy=True,
            show_progress_bar=True,
        )

    # ---------------------------
    # Semantic Search
    # ---------------------------
    def retrieve(self, user_input: str, top_k: int = 5):
        user_embedding = self.model.encode(
            [user_input],
            convert_to_numpy=True
        )

        similarities = cosine_similarity(
            user_embedding,
            self.corpus_embeddings
        )[0]

        self.df["semantic_score"] = similarities

        top_movies = (
            self.df.sort_values(by="semantic_score", ascending=False)
            .head(top_k)
        )

        return top_movies

    # ---------------------------
    # Prompt Engineering
    # ---------------------------
    @staticmethod
    def build_genai_context(top_movies: pd.DataFrame) -> str:
        context = ""
        for i, row in enumerate(top_movies.itertuples(), 1):
            context += f"""
Movie {i}:
Title: {row.Title}
Genres: {row.Genre}
Overview: {row.Overview}
Semantic Score: {round(row.semantic_score, 3)}
"""
        return context.strip()

    @staticmethod
    def build_prompt(user_input: str, genai_context: str) -> str:
        return f"""
You are a movie recommendation assistant.

User preferences:
"{user_input}"

Based on the following recommended movies:
{genai_context}

Tasks:
1. Explain clearly why these movies match the user's preferences.
2. Highlight emotional tone, themes, and atmosphere.
3. Write a short personalized recommendation summary (max 120 words).
4. Do NOT invent movies or facts.

Answer in a professional but accessible tone.
"""

    # ---------------------------
    # LLM Call (via cached LLMClient)
    # ---------------------------
    def call_llm(self, prompt: str) -> str:
        from src.genAi.llm_client import LLMClient
        client = LLMClient(url=self.llm_url, model=self.llm_model)
        return client.generate(prompt)

    # ---------------------------
    # Full RAG Pipeline
    # ---------------------------
    def recommend(self, user_input: str, top_k: int = 5):
        top_movies = self.retrieve(user_input, top_k)
        context = self.build_genai_context(top_movies)
        prompt = self.build_prompt(user_input, context)
        llm_output = self.call_llm(prompt)

        return {
            "retrieved_movies": top_movies[
                ["Title", "Genre", "semantic_score"]
            ].to_dict(orient="records"),
            "llm_response": llm_output,
        }