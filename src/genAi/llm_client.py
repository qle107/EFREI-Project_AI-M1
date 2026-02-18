import requests

from src.core.config import LLM_URL, LLM_MODEL


class LLMClient:
    def __init__(self, url: str | None = None, model: str | None = None):
        self.url = url or LLM_URL
        self.model = model or LLM_MODEL

    def generate(self, prompt):

        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False
        }

        response = requests.post(
            self.url,
            json=payload
        )

        if response.status_code != 200:
            raise RuntimeError(response.text)

        return response.json()["response"]
