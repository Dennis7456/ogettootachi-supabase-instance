#!/bin/bash

# Files to check
FILES=(
  "test-enhanced-chatbot.js"
  "scripts/test-chatbot-simple.js"
)

# Base directory
BASE_DIR="/Users/denniskiplangat/Documents/law-firm-website/ogettootachi-supabase-instance"

# Function to check file for potential issues
check_file() {
  local file="$1"
  local full_path="${BASE_DIR}/${file}"
  
  echo "Checking ${file}:"
  
  # Check for non-printable characters
  echo "Non-printable characters:"
  cat -A "${full_path}" | grep -P '[\x00-\x1F\x7F]'
  
  # Check for mixed quote styles
  echo "Mixed quote styles:"
  grep -P '["\'']' "${full_path}" | grep -vE "^[[:space:]]*(//)|(#)"
  
  # Check for potential encoding issues
  echo "File encoding:"
  file -i "${full_path}"
  
  # Attempt to parse with Node.js
  echo "Node.js parsing:"
  node --check "${full_path}" || echo "Parsing failed"
}

# Process each file
for file in "${FILES[@]}"; do
  check_file "${file}"
  echo "---"
done 