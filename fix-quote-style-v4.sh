#!/bin/bash

# List of files to fix
FILES=(
  "debug-invitation.js"
  "scripts/check-database-connection.js"
  "scripts/debug-dashboard-issue.js"
  "scripts/fix-storage-policies-final.js"
  "scripts/fix-syntax-errors.js"
  "scripts/test-edge-function-env.js"
)

# Change to the project root directory
cd "$(dirname "$0")"

# Run ESLint fix on each file
for file in "${FILES[@]}"; do
  echo "Fixing quote style in $file"
  npx eslint "$file" --fix
done

echo "Quote style fixes completed." 