#!/bin/bash

# Strict error handling
set -euo pipefail

# Directories to keep
KEEP_DIRS=(
    "ogetto-otachi-backend"
    "ogetto-otachi-frontend"
    "ogettootachi-supabase-instance"
    ".git"
    ".github"
)

# Files to keep
KEEP_FILES=(
    "README.md"
    ".gitignore"
)

# Function to check if a directory/file should be kept
should_keep() {
    local item="$1"
    
    # Check against keep directories
    for dir in "${KEEP_DIRS[@]}"; do
        if [[ "$item" == "$dir" ]]; then
            return 0
        fi
    done
    
    # Check against keep files
    for file in "${KEEP_FILES[@]}"; do
        if [[ "$item" == "$file" ]]; then
            return 0
        fi
    done
    
    return 1
}

# Backup current directory
BACKUP_DIR="../law-firm-website-backup-$(date +%Y%m%d_%H%M%S)"
echo "🔒 Creating backup of current directory: $BACKUP_DIR"
cp -R . "$BACKUP_DIR"

# Remove unnecessary items
echo "🧹 Cleaning up root folder..."
for item in *; do
    if [[ -d "$item" ]] || [[ -f "$item" ]]; then
        if ! should_keep "$item"; then
            echo "🗑️  Removing: $item"
            rm -rf "$item"
        fi
    fi
done

# Remove hidden items (except .git and .github)
for item in .*; do
    if [[ "$item" != "." ]] && [[ "$item" != ".." ]] && 
       [[ "$item" != ".git" ]] && [[ "$item" != ".github" ]]; then
        echo "🗑️  Removing hidden item: $item"
        rm -rf "$item"
    fi
done

echo "✅ Root folder cleanup complete"
echo "📋 Remaining items:"
ls -1 