"""
Generate static OpenAPI schema (JSON and YAML) for the API.
Run from project root: python scripts/generate_openapi.py
"""
import json
import sys
from pathlib import Path

# Project root = parent of scripts
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.api.app import app

OUT_DIR = PROJECT_ROOT / "docs"
OPENAPI_JSON = OUT_DIR / "openapi.json"
OPENAPI_YAML = OUT_DIR / "openapi.yaml"


def main():
    OUT_DIR.mkdir(exist_ok=True)
    schema = app.openapi()

    with open(OPENAPI_JSON, "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=2, ensure_ascii=False)

    print(f"Written: {OPENAPI_JSON}")

    try:
        import yaml
        with open(OPENAPI_YAML, "w", encoding="utf-8") as f:
            yaml.dump(schema, f, default_flow_style=False, allow_unicode=True, sort_keys=False)
        print(f"Written: {OPENAPI_YAML}")
    except ImportError:
        print("Install PyYAML (pip install pyyaml) to generate openapi.yaml")


if __name__ == "__main__":
    main()
