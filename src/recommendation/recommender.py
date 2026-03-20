class RecommendationEngine:

    def __init__(self, scored_df):

        self.df = scored_df

    def get_top3(self):

        # Sort by semantic coverage
        ranked = self.df.sort_values(
            by="CoverageScore",
            ascending=False,
        )

        # Keep Top 3
        top3 = ranked.head(3)

        # Format CineWatch Output
        recommendations = []

        for _, row in top3.iterrows():

            rec = {
                "FilmID": int(row["FilmID"]),
                "Title": row["Title"],
                "CoverageScore": round(
                    row["CoverageScore"], 3
                ),
                "MoodScore": round(
                    row["MoodScore"], 3
                ),
                "ThemeScore": round(
                    row["ThemeScore"], 3
                ),
                "StyleScore": round(
                    row["StyleScore"], 3
                ),
                "DescScore": round(
                    row["DescScore"], 3
                ),
                "RawMoodSimilarity": round(
                    row.get("RawMoodSimilarity", 0.0), 3
                ),
                "RawThemeSimilarity": round(
                    row.get("RawThemeSimilarity", 0.0), 3
                ),
                "RawStyleSimilarity": round(
                    row.get("RawStyleSimilarity", 0.0), 3
                ),
                "RawDescSimilarity": round(
                    row.get("RawDescSimilarity", 0.0), 3
                ),
            }

            recommendations.append(rec)

        return recommendations
