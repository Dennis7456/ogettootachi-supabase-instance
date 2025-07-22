#!/bin/bash

# List of files to process
FILES=(
  "debug-invitation.js"
  "scripts/check-database-connection.js"
  "scripts/debug-dashboard-issue.js"
  "scripts/fix-storage-policies-final.js"
  "scripts/fix-syntax-errors.js"
  "scripts/test-chatbot-simple.js"
  "scripts/test-edge-function-env.js"
  "test-enhanced-chatbot.js"
)

# Base directory
BASE_DIR="/Users/denniskiplangat/Documents/law-firm-website/ogettootachi-supabase-instance"

# Run ESLint with --fix on each file
for file in "${FILES[@]}"; do
  full_path="${BASE_DIR}/${file}"
  
  echo "Processing ${file}"
  npx eslint "${full_path}" --fix
done

# Final global ESLint check
npx eslint "${FILES[@]}" --fix 