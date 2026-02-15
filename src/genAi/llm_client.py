import requests


class LLMClient:

    def __init__(
        self,
        url="http://localhost:11434/api/generate",
        model="phi3:mini"
    ):
        self.url = url
        self.model = model

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
