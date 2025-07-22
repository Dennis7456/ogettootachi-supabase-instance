#!/bin/bash

# Files to process
FILES=(
  "debug-invitation.js"
  "scripts/check-database-connection.js"
  "scripts/debug-dashboard-issue.js"
  "scripts/fix-storage-policies-final.js"
  "scripts/fix-syntax-errors.js"
  "scripts/test-edge-function-env.js"
)

# Base directory
BASE_DIR="/Users/denniskiplangat/Documents/law-firm-website/ogettootachi-supabase-instance"

# Process each file
for file in "${FILES[@]}"; do
  full_path="${BASE_DIR}/${file}"
  
  # Replace double quotes with single quotes
  sed -i '' \
    -e "s/\(console\.\(log\|warn\|error\)\)(\"\([^\"]*\)\"/\1('\3'/g" \
    -e "s/return \"\([^\"]*\)\"/return '\1'/g" \
    -e "s/= \"\([^\"]*\)\"/= '\1'/g" \
    "${full_path}"
  
  echo "Processed ${file}"
done

# Run ESLint to verify and fix any remaining issues
npx eslint "${FILES[@]}" --fix 