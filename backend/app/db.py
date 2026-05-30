from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# backend/ 根目录（monorepo: app/db.py 在 backend/app/db.py，两级上去就是 backend/）
BACKEND_DIR = Path(__file__).resolve().parent.parent

DB_PATH = Path(os.environ.get("MEALMATE_DB", BACKEND_DIR / "data" / "mealmate.db"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,
  apple_sub   TEXT NOT NULL UNIQUE,
  email       TEXT,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash    TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at    TEXT NOT NULL,
  last_used_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

CREATE TABLE IF NOT EXISTS user_data (
  user_id        TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  payload        TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  updated_at     TEXT NOT NULL
);
"""


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DB_PATH) as conn:
        conn.executescript(SCHEMA)
        conn.commit()


@contextmanager
def get_conn() -> Iterator[sqlite3.Connection]:
    conn = sqlite3.connect(DB_PATH, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
    finally:
        conn.close()
