# backup_supabase.sh
#!/usr/bin/env bash
set -euo pipefail

# === LOAD ENVIRONMENT ===
if [ -f .env ]; then
  # export all non-comment lines like VAR=value
  export $(grep -v '^\s*#' .env | xargs)
fi

# === REQUIREMENTS ===
: "${SUPABASE_PROJECT_REF:?Error: SUPABASE_PROJECT_REF is not set}"
: "${SUPABASE_POOLER_HOST:?Error: SUPABASE_POOLER_HOST is not set}"
: "${SUPABASE_POOLER_PORT:?Error: SUPABASE_POOLER_PORT is not set}"
: "${SUPABASE_DB_USER:?Error: SUPABASE_DB_USER is not set}"
: "${SUPABASE_DB_PASSWORD:?Error: SUPABASE_DB_PASSWORD is not set}"

# Backup settings
BACKUP_DIR="backups"
RETENTION=7   # keep the 7 most recent

# Show what we’re doing
echo "Project Ref: $SUPABASE_PROJECT_REF"
echo "Using pg_dump version: $(pg_dump --version)"

# Determine DB name and user
DB_NAME="${SUPABASE_DB_NAME:-postgres}"
DB_USER="$SUPABASE_DB_USER"

# Provide password to pg_dump/psql
export PGPASSWORD=$SUPABASE_DB_PASSWORD

# Prepare output directory
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +'%F_%H%M')
BACKUP_FILE="$BACKUP_DIR/supabase_backup_${TIMESTAMP}.dump"

echo "Starting pg_dump to $BACKUP_FILE …"
pg_dump \
  --host="$SUPABASE_POOLER_HOST" \
  --port="$SUPABASE_POOLER_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --format=custom \
  --verbose \
  --file="$BACKUP_FILE"

echo "✅ Backup successful: $BACKUP_FILE"

# Retention: delete older dumps
echo "Cleaning up old backups (keeping $RETENTION)…"
ls -1t "$BACKUP_DIR"/supabase_backup_*.dump \
  | tail -n +$((RETENTION+1)) \
  | xargs -r rm --

echo "All done."
