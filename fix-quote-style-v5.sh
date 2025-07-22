#!/bin/bash

# Ensure we're in the correct directory
cd "$(dirname "$0")"

# List of files to fix
FILES=(
  "debug-invitation.js"
  "scripts/check-database-connection.js"
  "scripts/debug-dashboard-issue.js"
  "scripts/fix-storage-policies-final.js"
  "scripts/fix-syntax-errors.js"
  "scripts/test-edge-function-env.js"
)

# Function to replace double quotes with single quotes
replace_quotes() {
  local file="$1"
  echo "Processing $file..."
  
  # Use sed to replace double quotes with single quotes
  # This handles different scenarios of string quotes
  sed -i '' "s/\"\([^\"]*\)\"/'\1'/g" "$file"
}

# Process each file
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    replace_quotes "$file"
  else
    echo "File not found: $file"
  fi
done

# Run ESLint fix as a final pass
npm run lint:fix

echo "Quote style fixes completed." 