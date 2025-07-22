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
echo 'SUPABASE_ANON_KEY="test_long_secret_key_that_would_normally_trigger_detection"' > test-secret-detection/test_secret.sh
echo 'SUPABASE_ANON_KEY="test_long_secret_key_that_would_normally_trigger_detection"' > test-secret-detection/backups/backup_secret.sh
echo 'SUPABASE_ANON_KEY="test_long_secret_key_that_would_normally_trigger_detection"' > test-secret-detection/invitation-system-backup-20250720-021227/auth.toml
echo 'SUPABASE_ANON_KEY="test_long_secret_key_that_would_normally_trigger_detection"' > test-secret-detection/node_modules/secret.sh
echo 'SUPABASE_ANON_KEY="test_long_secret_key_that_would_normally_trigger_detection"' > test-secret-detection/.git/secret.sh
echo 'SUPABASE_ANON_KEY="test_long_secret_key_that_would_normally_trigger_detection"' > test-secret-detection/config/auth.toml
touch test-secret-detection/test.dump
touch test-secret-detection/test.html
touch test-secret-detection/test.md
touch test-secret-detection/test.json

# Run secret detection
echo "🔍 Running Secret Detection Test..."

# More precise secret detection
SECRET_DETECTION=$(grep -r -i -E '(password|secret|key|token|credentials).*=.*['\"][^'\"]{8,}' \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    --exclude-dir=backups \
    --exclude=*.html \
    --exclude=*.md \
    --exclude=*.json \
    --exclude=config/auth.toml \
    --exclude='invitation-system-backup-*/auth.toml' \
    --exclude=*.dump \
    test-secret-detection | grep -v 'email-templates')

# Clean up test files
rm -rf test-secret-detection

# Check results
if [ -n "$SECRET_DETECTION" ]; then
    echo "❌ Secret Detection Test FAILED"
    echo "Detected secrets:"
    echo "$SECRET_DETECTION"
    exit 1
else
    echo "✅ Secret Detection Test PASSED"
    echo "No secrets detected in excluded files/directories"
    exit 0
fi
