#!/bin/bash

# Linting script for Ogetto, Otachi & Co Advocates

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status="$1"
    local message="$2"
    local color="$3"
    echo -e "${color}${status}${NC} ${message}"
}

# Function to clean JavaScript files
clean_js_file() {
    local input_file="$1"
    local output_file="$2"

    # Remove shebang lines
    sed '/^#!/d' "$input_file" > "$output_file"

    # Remove import statements
    sed -i '' '/^import /d' "$output_file"

    # Remove 'use strict' directive
    sed -i '' '/^["'"'"']use strict["'"'"'];/d' "$output_file"

    # Remove console.log statements
    sed -i '' '/console\.log(/d' "$output_file"

    # Remove debugger statements
    sed -i '' '/debugger;/d' "$output_file"

    # Remove commented debug code
    sed -i '' '/\/\/.*debug/d' "$output_file"

    # Remove empty lines
    sed -i '' '/^$/d' "$output_file"
}

# Main linting function
main() {
    # Ensure we're in the right directory
    cd "$(dirname "$0")" || exit 1

    # Check if a file is provided
    if [ $# -eq 0 ]; then
        print_status "❌" "No files specified for linting" "$RED"
        exit 1
    fi

    # Lint the specific file(s) provided
    local overall_exit_code=0
    for file in "$@"; do
        # Skip configuration and non-JavaScript files
        if [[ "$file" =~ (\.config\.|\.eslintrc\.|\.prettierrc\.|\.lintstagedrc\.) ]] || \
           [[ ! "$file" =~ \.(js|jsx)$ ]]; then
            print_status "⏩" "Skipping $file" "$YELLOW"
            continue
        fi

        # Check if file exists
        if [ ! -f "$file" ]; then
            print_status "❌" "File not found: $file" "$RED"
            overall_exit_code=1
            continue
        fi

        print_status "🔍" "Cleaning $file" "$YELLOW"

        # Create a temporary cleaned file
        local temp_file
        temp_file=$(mktemp)
        clean_js_file "$file" "$temp_file"

        # Compare the files
        if ! cmp -s "$file" "$temp_file"; then
            print_status "🔧" "Cleaning applied to $file" "$GREEN"
            
            # Copy the cleaned file back
            cp "$temp_file" "$file"
            
            # Stage the cleaned file
            git add "$file"
        else
            print_status "✅" "No changes needed for $file" "$GREEN"
        fi

        # Clean up temporary file
        rm "$temp_file"
    done

    # Exit with the overall status
    exit $overall_exit_code
}

# Run the main script
main "$@" 