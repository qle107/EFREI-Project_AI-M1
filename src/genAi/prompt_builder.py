def build_aisca_prompt(user_input, top3):

    movies_context = ""

    for i, movie in enumerate(top3, 1):

        movies_context += f"""
Movie {i}:
Title: {movie['Title']}
Coverage Score: {movie['CoverageScore']}
Mood Match: {movie['MoodScore']}
Theme Match: {movie['ThemeScore']}
Style Match: {movie['StyleScore']}
Description Match: {movie['DescScore']}
"""

    prompt = f"""
You are a movie recommendation expert.

User Request:
{user_input.description}

Based on the following semantic analysis results:

{movies_context}

Tasks:
1. Explain why these 3 movies match the user intent.
2. Identify which aspects match best (mood, theme, style).
3. Highlight what is missing (low scores).
4. Suggest how the user can refine preferences.
5. Write a short personalized recommendation summary.

Do NOT invent any movie information.
Keep answer under 150 words.
"""

    return prompt
