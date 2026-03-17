"""
Lightweight SQLite store for recommendation generation history.

Each generation is saved with user_id, timestamp, request snapshot, and the full
API response (recommendations list, explanation, cinephile_profile, etc.) so users
can view past recommendations and the exact movies that were recommended.
DB file lives in data/.
"""
from __future__ import annotations

import json
import logging
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from src.core.config import DATA_DIR

logger = logging.getLogger(__name__)

_DB_PATH: Path = DATA_DIR / "recommendation_history.db"
_CONN: sqlite3.Connection | None = None


def _get_conn() -> sqlite3.Connection:
    global _CONN
    if _CONN is None:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        _CONN = sqlite3.connect(str(_DB_PATH), check_same_thread=False)
        _CONN.row_factory = sqlite3.Row
        _init_db(_CONN)
    return _CONN


def _init_db(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS recommendation_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            request_json TEXT NOT NULL,
            response_json TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_history_user_created ON recommendation_history(user_id, created_at DESC);
    """)
    conn.commit()


def save(
    user_id: str,
    request_payload: dict[str, Any],
    response_payload: dict[str, Any],
) -> int:
    """
    Save one recommendation generation. response_payload must be the full API
    response (recommendations list, explanation, cinephile_profile, etc.).
    Returns the new row id.
    """
    conn = _get_conn()
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        "INSERT INTO recommendation_history (user_id, created_at, request_json, response_json) VALUES (?, ?, ?, ?)",
        (user_id, now, json.dumps(request_payload), json.dumps(response_payload)),
    )
    conn.commit()
    row_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    logger.info("Saved recommendation history id=%s for user_id=%s", row_id, user_id)
    return row_id


def delete_all() -> int:
    """Delete all recommendation history entries. Returns the number of rows deleted."""
    conn = _get_conn()
    cur = conn.execute("SELECT COUNT(*) FROM recommendation_history")
    count = cur.fetchone()[0]
    conn.execute("DELETE FROM recommendation_history")
    conn.commit()
    logger.info("Cleared all recommendation history (%s rows)", count)
    return count


def list_by_user(user_id: str, limit: int = 50) -> list[dict[str, Any]]:
    """List history entries for a user, newest first. Lightweight: id, created_at, summary only."""
    conn = _get_conn()
    rows = conn.execute(
        "SELECT id, user_id, created_at, request_json, response_json FROM recommendation_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
        (user_id, limit),
    ).fetchall()
    out = []
    for row in rows:
        req = json.loads(row["request_json"])
        desc = (req.get("description") or "")[:80]
        resp = json.loads(row["response_json"]) or {}
        preset_id = resp.get("preset_id")
        if preset_id:
            summary = f"Preset: {preset_id}"
        else:
            summary = desc + ("…" if len(req.get("description") or "") > 80 else "")
        out.append({
            "id": row["id"],
            "created_at": row["created_at"],
            "summary": summary or "Recommendation",
        })
    return out


def get_by_id(user_id: str, history_id: int) -> dict[str, Any] | None:
    """Return one history entry by id if it belongs to the user."""
    conn = _get_conn()
    row = conn.execute(
        "SELECT id, user_id, created_at, request_json, response_json FROM recommendation_history WHERE id = ? AND user_id = ?",
        (history_id, user_id),
    ).fetchone()
    if row is None:
        return None
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "created_at": row["created_at"],
        "request": json.loads(row["request_json"]),
        "response": json.loads(row["response_json"]),
    }
