from pydantic import BaseModel


class UserQuestionnaire(BaseModel):

    # Open text
    description: str

    # Guided preferences
    preferred_mood: str
    preferred_genre: str
    preferred_style: str

    # Likert scale (1–5)
    mood_intensity: int
    theme_interest: int
    style_interest: int
