#!/usr/bin/env bash
set -euo pipefail

# Root of your Supabase project (adjust if this script lives elsewhere)
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
MIGRATIONS_DIR="$ROOT_DIR/supabase/migrations"

echo "Project root: $ROOT_DIR"
echo "Marking all migrations as applied..."

cd "$ROOT_DIR"
# Make sure we have a linked project
supabase link >/dev/null 2>&1 || {
  echo "⚠️  Project not linked. Run 'supabase link' first."
  exit 1
}

cd "$MIGRATIONS_DIR"
for file in [0-9]*_*.sql; do
  # Skip backups or disabled
  [[ "$file" =~ \.disabled$ ]] && continue
  [[ "$file" =~ \.bak$      ]] && continue

  ts="${file%%_*}"
  if [[ "$ts" =~ ^[0-9]{14}$ ]]; then
    echo "→ Marking migration $ts as applied"
    supabase migration repair --status applied "$ts"
  else
    echo "– Skipping non-migration file: $file"
  fi

done

echo "✅ All migrations marked applied." 