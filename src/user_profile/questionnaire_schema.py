from typing import Optional
from pydantic import BaseModel


class UserQuestionnaire(BaseModel):

    # Open text
    description: str

    # Guided preferences
    preferred_mood: str
    preferred_genre: str
    preferred_style: str

    # Guided questions (directors, period)
    preferred_era: Optional[str] = None
    preferred_director: Optional[str] = None

    # Likert scale (1-5)
    mood_intensity: int
    theme_interest: int
    style_interest: int
