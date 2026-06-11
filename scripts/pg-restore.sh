#!/usr/bin/env bash
# Restore aus pg_dump Custom-Format (.dump)
# Nutzung: npm run db:restore -- backups/postgres/webwelle-YYYYMMDD-HHMMSS.dump
set -euo pipefail

DUMP_FILE="${1:-}"
DATABASE_URL="${DATABASE_URL:-${DATABASE_PUBLICURL:-}}"

if [[ -z "$DUMP_FILE" || ! -f "$DUMP_FILE" ]]; then
  echo "Nutzung: $0 <pfad-zur-.dump-datei>"
  exit 1
fi

if [[ -z "$DATABASE_URL" ]]; then
  echo "❌ DATABASE_URL oder DATABASE_PUBLICURL muss gesetzt sein"
  exit 1
fi

if ! command -v pg_restore >/dev/null 2>&1; then
  echo "❌ pg_restore nicht gefunden"
  exit 1
fi

echo "⚠️  ACHTUNG: Restore überschreibt Objekte in der Zieldatenbank!"
echo "    Ziel: $DATABASE_URL"
echo "    Quelle: $DUMP_FILE"
read -r -p "Fortfahren? (yes/no): " CONFIRM
if [[ "$CONFIRM" != "yes" ]]; then
  echo "Abgebrochen."
  exit 0
fi

pg_restore --clean --if-exists --no-owner --no-acl -d "$DATABASE_URL" "$DUMP_FILE"
echo "✅ Restore abgeschlossen – App smoke-testen (Login, Buchungen)"
