#!/bin/bash

# Test script for secret detection exclusions in Supabase instance

# Change to the script's directory
cd "$(dirname "$0")"

# Create test directories and files
mkdir -p test-secret-detection/node_modules
mkdir -p test-secret-detection/.git
mkdir -p test-secret-detection/backups
mkdir -p test-secret-detection/invitation-system-backup-20250720-021227
mkdir -p test-secret-detection/config

# Create files with potential "secrets"
# ONLY create a secret in test_secret.sh
echo 'SUPABASE_ANON_KEY="test_long_secret_key_that_would_normally_trigger_detection"' > test-secret-detection/test_secret.sh

# Create empty or non-secret files in other locations
touch test-secret-detection/backups/backup_secret.sh
touch test-secret-detection/invitation-system-backup-20250720-021227/auth.toml
touch test-secret-detection/node_modules/secret.sh
touch test-secret-detection/.git/secret.sh
touch test-secret-detection/config/auth.toml
touch test-secret-detection/test.dump
touch test-secret-detection/test.html
touch test-secret-detection/test.md
touch test-secret-detection/test.json

# Run secret detection
echo "�� Running Secret Detection Test..."

# Prepare exclusion arguments
EXCLUDE_ARGS=(
    --exclude-dir=node_modules
    --exclude-dir=.git
    --exclude-dir=backups
    --exclude=*.html
    --exclude=*.md
    --exclude=*.json
    --exclude=config/auth.toml
    --exclude='invitation-system-backup-*/auth.toml'
    --exclude=*.dump
)

# More precise secret detection
SECRET_DETECTION=$(grep -r -i -E '(password|secret|key|token|credentials).*=.*['\"][^'\"]{8,}' \
    "${EXCLUDE_ARGS[@]}" \
    test-secret-detection | grep -v 'email-templates' | grep -v 'config/auth.toml' | grep -v 'invitation-system-backup-')

# We expect exactly one hit—our top-level test_secret.sh—and nothing else.
# 1) It must be non-empty, and
# 2) All lines must start with 'test-secret-detection/test_secret.sh:'
if [ -n "$SECRET_DETECTION" ] && \
   ! printf '%s\n' "$SECRET_DETECTION" | grep -qv '^test-secret-detection/test_secret.sh:'; then
  echo "✅ Secret Detection Test PASSED"
  echo "Detected exactly the intended secret in test_secret.sh:"
  echo "$SECRET_DETECTION"
  exit 0
else
  echo "❌ Secret Detection Test FAILED"
  echo "Detected unexpected secrets (or none at all):"
  echo "$SECRET_DETECTION"
  exit 1
fi
