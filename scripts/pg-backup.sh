#!/usr/bin/env bash
# Manuelles PostgreSQL-Backup (pg_dump) – Ergänzung zu Coolify Scheduled Backups
# Nutzung: npm run db:backup
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT_DIR/backups/postgres}"
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
DATABASE_URL="${DATABASE_URL:-${DATABASE_PUBLICURL:-}}"

if [[ -z "$DATABASE_URL" ]]; then
  echo "❌ DATABASE_URL oder DATABASE_PUBLICURL muss gesetzt sein"
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "❌ pg_dump nicht gefunden – PostgreSQL Client Tools installieren"
  exit 1
fi

mkdir -p "$BACKUP_DIR"
OUT_FILE="$BACKUP_DIR/webwelle-${TIMESTAMP}.dump"

echo "📦 Backup nach $OUT_FILE ..."
pg_dump "$DATABASE_URL" -Fc --no-owner --no-acl -f "$OUT_FILE"

META_FILE="$BACKUP_DIR/LAST_BACKUP.json"
cat > "$META_FILE" <<EOF
{
  "file": "$(basename "$OUT_FILE")",
  "path": "$OUT_FILE",
  "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "sizeBytes": $(stat -f%z "$OUT_FILE" 2>/dev/null || stat -c%s "$OUT_FILE")
}
EOF

echo "✅ Backup fertig"
echo "   Datei: $OUT_FILE"
echo "   Meta:  $META_FILE"
echo ""
echo "Optional in Production setzen:"
echo "   BACKUP_LAST_SUCCESS_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
