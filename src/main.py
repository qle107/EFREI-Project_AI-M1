import uvicorn

def start():
    uvicorn.run(
        "api.api:app",  # module_path:variable
        host="0.0.0.0",
        port=8000,
        reload=True
    )

if __name__ == "__main__":
    start()

# {
#   "description": "I want a dark emotional story with mystery",
#   "preferred_mood": "dark",
#   "preferred_genre": "crime",
#   "preferred_style": "slow",
#   "mood_intensity": 5,
#   "theme_interest": 4,
#   "style_interest": 3
# }