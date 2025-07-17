#!/usr/bin/env bash
set -euo pipefail

# === CONFIGURATION ===
# Load environment variables from .env if it exists
if [ -f .env ]; then
  # only export non-commented lines like VAR=value
  export $(grep -v '^\s*#' .env | xargs)
fi

# These must be set in your environment or .env:
# SUPABASE_SERVICE_ROLE_KEY
# SUPABASE_PROJECT_REF

SUPABASE_DB_URL="postgres://service_role:${SUPABASE_SERVICE_ROLE_KEY}@db.${SUPABASE_PROJECT_REF}.supabase.co:5432/postgres?sslmode=require"
BACKUP_DIR="backups"
RETENTION=7   # Number of most recent backups to keep

# === SCRIPT START ===

# Debug (optional): show loaded vars
echo "Project Ref: ${SUPABASE_PROJECT_REF}"
echo "Service Role Key (first 20 chars): ${SUPABASE_SERVICE_ROLE_KEY:0:20}..."

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate timestamped filename
TIMESTAMP=$(date +'%F_%H%M')
BACKUP_FILE="${BACKUP_DIR}/supabase_backup_${TIMESTAMP}.sql"

# Run the backup
echo "Starting Supabase backup to $BACKUP_FILE ..."
supabase db dump --db-url "$SUPABASE_DB_URL" --file "$BACKUP_FILE"

echo "Backup successful: $BACKUP_FILE"

# Retention: delete older backups, keep only the latest $RETENTION files
echo "Cleaning up old backups (keeping $RETENTION most recent)..."
ls -1t "${BACKUP_DIR}"/supabase_backup_*.sql \
  | tail -n +$((RETENTION+1)) \
  | xargs -r rm --

echo "Done."
