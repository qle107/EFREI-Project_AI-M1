# CineWatch API — Python 3.11, CPU-only PyTorch via pip wheels
FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# OpenMP for PyTorch / numpy stacks on Debian slim
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirement.txt .
RUN pip install --upgrade pip && pip install -r requirement.txt

COPY src ./src
COPY models ./models

RUN mkdir -p /app/data/processed /app/data/raw

EXPOSE 8000

CMD ["uvicorn", "src.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
