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
  
  # Extensive quote replacement strategy
  sed -i '' \
    -e "s/\(console\.\(log\|warn\|error\)\)(\"\([^\"]*\)\"/\1('\3'/g" \
    -e "s/return \"\([^\"]*\)\"/return '\1'/g" \
    -e "s/= \"\([^\"]*\)\"/= '\1'/g" \
    -e "s/\(const\|let\|var\) \([a-zA-Z_][a-zA-Z0-9_]*\) *= *\"\([^\"]*\)\"/\1 \2 = '\3'/g" \
    -e "s/\(message\|text\|description\|title\|content\) *: *\"\([^\"]*\)\"/\1: '\2'/g" \
    -e "s/\(placeholder\|alt\|label\) *= *\"\([^\"]*\)\"/\1 = '\2'/g" \
    -e "s/\(href\|src\) *= *\"\([^\"]*\)\"/\1 = '\2'/g" \
    -e "s/import \([^']*\) from \"\([^\"]*\)\"/import \1 from '\2'/g" \
    -e "s/\(export default\) *\"\([^\"]*\)\"/\1 '\2'/g" \
    -e "s/\(module\.exports\) *= *\"\([^\"]*\)\"/\1 = '\2'/g" \
    -e "s/\(process\.env\.[A-Z_]*\) *= *\"\([^\"]*\)\"/\1 = '\2'/g" \
    -e "s/\(warn\|error\)(\"\([^\"]*\)\"/\1('\2'/g" \
    -e "s/\(throw new Error\)(\"\([^\"]*\)\"/\1('\2'/g" \
    -e "s/\(JSON\.stringify\)(\"\([^\"]*\)\"/\1('\2'/g" \
    -e "s/\(path\.join\)(\"\([^\"]*\)\"/\1('\2'/g" \
    "${full_path}"
  
  echo "Processed ${file}"
done

# Run ESLint to verify and fix any remaining issues
npx eslint "${FILES[@]}" --fix 