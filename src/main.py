import uvicorn


def start():
    """
    Entry point to launch the FastAPI server.
    """
    uvicorn.run(
        "movie_recommender.api:app",  # module_path:variable
        host="0.0.0.0",
        port=8000,
        reload=True  # auto-reload during development
    )


if __name__ == "__main__":
    start()