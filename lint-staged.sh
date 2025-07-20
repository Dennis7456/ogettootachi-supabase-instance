#!/bin/bash

# Lint Staged Files Script

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

# Main lint-staged function
main() {
    # Get staged JavaScript files, excluding configuration and node_modules
    local js_files
    js_files=$(git diff --cached --name-only --diff-filter=ACM | \
        grep -E '\.(js|jsx)$' | \
        grep -v 'node_modules' | \
        grep -v '\.config\.' | \
        grep -v '\.eslintrc\.' | \
        grep -v '\.prettierrc\.' | \
        grep -v '\.lintstagedrc\.')

    # Get staged JSON, MD, YAML files, excluding package-lock.json
    local config_files
    config_files=$(git diff --cached --name-only --diff-filter=ACM | \
        grep -E '\.(json|md|yml|yaml)$' | \
        grep -v 'package-lock\.json')

    # Lint and format JavaScript files
    if [ -n "$js_files" ]; then
        print_status "🔍" "Linting JavaScript files" "$YELLOW"
        
        # Use a traditional for loop
        for file in $js_files; do
            ./lint-fix.sh "$file"
            local js_lint_status=$?
            
            if [ $js_lint_status -ne 0 ]; then
                print_status "❌" "JavaScript linting failed for $file" "$RED"
                return $js_lint_status
            fi
        done
    fi

    # Format configuration files
    if [ -n "$config_files" ]; then
        print_status "🎨" "Formatting configuration files" "$YELLOW"
        
        # Use a traditional for loop
        for file in $config_files; do
            npx prettier --write "$file"
            local config_format_status=$?
            
            if [ $config_format_status -ne 0 ]; then
                print_status "❌" "Configuration file formatting failed for $file" "$RED"
                return $config_format_status
            fi
            
            # Stage formatted file
            git add "$file"
        done
    fi

    print_status "✅" "Lint and format completed successfully" "$GREEN"
    return 0
}

# Run the main script
main 