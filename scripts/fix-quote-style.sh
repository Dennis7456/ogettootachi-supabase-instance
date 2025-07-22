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

# Process each file
for file in "${FILES[@]}"; do
  full_path="${BASE_DIR}/${file}"
  
  # Create a backup of the original file
  cp "${full_path}" "${full_path}.bak"
  
  # Use sed to replace double quotes with single quotes
  # More conservative approach to avoid breaking syntax
  sed -i '' \
    -e "s/\(console\.\(log\|warn\|error\)\)(\"\([^\"]*\)\"/\1('\3'/g" \
    -e "s/'\([^']*\)\"\\([^\"]*\\)'/'\1\2'/g" \
    "${full_path}"
  
  # Validate the file syntax
  if ! npx eslint "${full_path}" --fix; then
    echo "Error processing ${file}. Restoring backup."
    mv "${full_path}.bak" "${full_path}"
  else
    rm "${full_path}.bak"
    echo "Processed ${file}"
  fi
done

# Final ESLint check
npx eslint "${FILES[@]}" --fix 