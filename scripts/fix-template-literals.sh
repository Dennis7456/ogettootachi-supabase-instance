#!/bin/bash

# Find all JavaScript files in the project
find . -type f \( -name "*.js" -o -name "*.mjs" \) | while read -r file; do
    # Use sed to replace unlogged template literals with console.log()
    sed -i -E 's/^[ \t]*(`[^`]+`);?[ \t]*\);?$/    console.log(\1);/g' "$file"
done

echo "Unlogged template literals have been converted to console.log() calls." 