from sentence_transformers import SentenceTransformer


def load_sbert_model():

    model = SentenceTransformer(
        "sentence-transformers/all-MiniLM-L6-v2"
    )

    print("SBERT model loaded ✔")

    return model
