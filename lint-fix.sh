#!/bin/bash

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

# Main linting function
main() {
    # Ensure we're in the right directory
    cd "$(dirname "$0")" || exit 1

    # Run ESLint with auto-fix
    print_status "🔧" "Running ESLint auto-fix" "$YELLOW"
    
    # Temporary file for error output
    ERROR_LOG=$(mktemp)

    # Use npx to run eslint with flat config
    npx eslint . \
        --config eslint.config.js \
        --fix 2> "$ERROR_LOG"

    # Check ESLint exit code
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        print_status "✅" "Linting and auto-fix completed successfully" "$GREEN"
        rm "$ERROR_LOG"
    else
        print_status "❌" "Linting encountered issues" "$RED"
        
        # Print error details
        if [ -s "$ERROR_LOG" ]; then
            print_status "🔍" "Error Details:" "$YELLOW"
            cat "$ERROR_LOG"
        fi
        
        print_status "💡" "Some files may require manual fixing" "$YELLOW"
        rm "$ERROR_LOG"
    fi

    exit $exit_code
}

# Run the main script
main "$@" 