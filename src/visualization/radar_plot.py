import matplotlib.pyplot as plt
import pandas as pd
import numpy as np


def plot_radar_chart(top3):
    """
    top3: list of dicts with keys:
        Title, MoodScore, ThemeScore, StyleScore, DescScore
    """

    # Labels for radar
    categories = ["Mood", "Theme", "Style", "Description"]
    N = len(categories)

    # Create radar for each movie
    for movie in top3:
        values = [
            movie["MoodScore"],
            movie["ThemeScore"],
            movie["StyleScore"],
            movie["DescScore"]
        ]
        values += values[:1]  # close the circle

        angles = np.linspace(0, 2 * np.pi, N, endpoint=False).tolist()
        angles += angles[:1]

        # Plot
        fig, ax = plt.subplots(figsize=(6,6), subplot_kw=dict(polar=True))
        ax.plot(angles, values, linewidth=2, linestyle='solid', label=movie["Title"])
        ax.fill(angles, values, alpha=0.25)

        ax.set_xticks(angles[:-1])
        ax.set_xticklabels(categories)

        ax.set_yticks([0.2, 0.4, 0.6, 0.8, 1.0])
        ax.set_ylim(0,1)

        plt.title(f"{movie['Title']} — Semantic Coverage")
        plt.legend(loc='upper right')
        plt.show()
