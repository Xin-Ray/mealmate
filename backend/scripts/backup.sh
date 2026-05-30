#!/usr/bin/env bash
# Daily SQLite backup. Uses sqlite3's online ".backup" so it's safe while the
# server is writing. Keeps last 14 days of backups.
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DB="$BACKEND_DIR/data/mealmate.db"
OUT_DIR="$BACKEND_DIR/data/backups"
mkdir -p "$OUT_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$OUT_DIR/mealmate-$STAMP.db"

if [ ! -f "$DB" ]; then
  echo "no DB at $DB, nothing to back up" >&2
  exit 0
fi

sqlite3 "$DB" ".backup '$OUT'"
gzip -f "$OUT"

# Prune backups older than 14 days
find "$OUT_DIR" -type f -name 'mealmate-*.db.gz' -mtime +14 -delete

echo "wrote ${OUT}.gz"
