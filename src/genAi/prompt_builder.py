def build_cinewatch_prompt(user_input, top3):
    movies_context = ""
    for i, movie in enumerate(top3, 1):
        movies_context += (
            f"\nFilm {i}: {movie['Title']}\n"
            f"  Coverage Score : {float(movie['CoverageScore']):.0%}\n"
            f"  Mood Match     : {float(movie['MoodScore']):.0%}\n"
            f"  Theme Match    : {float(movie['ThemeScore']):.0%}\n"
            f"  Style Match    : {float(movie['StyleScore']):.0%}\n"
            f"  Desc Match     : {float(movie['DescScore']):.0%}\n"
        )

    titles = [movie['Title'] for movie in top3]
    title1 = titles[0] if len(titles) > 0 else "Film 1"
    title2 = titles[1] if len(titles) > 1 else "Film 2"
    title3 = titles[2] if len(titles) > 2 else "Film 3"

    prompt = (
        "You are a cinematic AI analyst. Write a structured recommendation explanation "
        "using EXACTLY the section headers below, in this order, with no extra headers or preamble.\n\n"
        "FORMAT TO FOLLOW:\n\n"
        "OVERVIEW:\n"
        "[2-3 sentences: why these 3 films collectively match the user's request. "
        "Reference the dominant semantic dimensions (mood, theme, style).]\n\n"
        f"FILM_1: {title1}\n"
        "[1-2 sentences: what specifically makes this film the top match. "
        "Reference its strongest scoring dimensions.]\n\n"
        f"FILM_2: {title2}\n"
        "[1-2 sentences: same structure.]\n\n"
        f"FILM_3: {title3}\n"
        "[1-2 sentences: same structure. Mention any lower-scoring dimension if relevant.]\n\n"
        "REFINE:\n"
        "[1 sentence: a concrete way the user could sharpen preferences for better results.]\n\n"
        "CINEPHILE_PROFILE:\n"
        "[2 sentences: a profile of this user as a cinephile — their sensibility, taste, and film personality.]\n\n"
        "---\n\n"
        "USER PREFERENCES:\n"
        f"  Description : {user_input.description}\n"
        f"  Mood        : {user_input.preferred_mood} (intensity {user_input.mood_intensity}/5)\n"
        f"  Genre       : {user_input.preferred_genre} (interest {user_input.theme_interest}/5)\n"
        f"  Style       : {user_input.preferred_style} (interest {user_input.style_interest}/5)\n"
    )

    if getattr(user_input, "preferred_era", None):
        prompt += f"  Era         : {user_input.preferred_era}\n"
    if getattr(user_input, "preferred_director", None):
        prompt += f"  Director    : {user_input.preferred_director}\n"

    prompt += (
        f"\nSEMANTIC SCORES:\n{movies_context}\n"
        "RULES: Do NOT invent film data. Stay grounded in the scores. "
        "Each FILM section header must include the exact film title as shown. "
        "Keep each section to 1-3 sentences maximum. "
        "Do not add any section not listed above.\n"
    )

    return prompt


def build_enrichment_prompt(short_description: str) -> str:
    return (
        "You are a movie preference assistant. The user typed a very brief description "
        "of what kind of movie they want. Expand this into a detailed 2-3 sentence "
        "description that preserves the original intent and adds useful context about "
        "tone, themes, pacing, and style that would help a recommendation engine.\n\n"
        f"User input: \"{short_description}\"\n\n"
        "Expanded description (2-3 sentences, no preamble):"
    )
