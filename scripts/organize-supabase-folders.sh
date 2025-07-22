#!/bin/bash

# Strict error handling
set -euo pipefail

# Target Supabase instance directory
SUPABASE_DIR="ogettootachi-supabase-instance"

# Folders to move
FOLDERS_TO_MOVE=(
    "scripts"
    "invitation-system-backup-20250720-021227"
    ".github"
    ".husky"
    "fresh-repo"
    "security-tools"
    "supabase"
)

# Files to move
FILES_TO_MOVE=(
    ".gitignore"
    "README.md"
    "setup-production-email.sh"
    "setup-env.sh"
    "remove-secrets.sh"
    "secret-manager.sh"
    "package.json"
    "package-lock.json"
)

# Backup current directory
BACKUP_DIR="../law-firm-website-backup-$(date +%Y%m%d_%H%M%S)"
echo "🔒 Creating backup of current directory: $BACKUP_DIR"
cp -R . "$BACKUP_DIR"

# Move folders
echo "📂 Moving folders to $SUPABASE_DIR..."
for folder in "${FOLDERS_TO_MOVE[@]}"; do
    if [ -d "$folder" ]; then
        echo "Moving $folder..."
        # If destination folder exists, merge contents
        if [ -d "$SUPABASE_DIR/$folder" ]; then
            cp -r "$folder"/* "$SUPABASE_DIR/$folder/"
            rm -rf "$folder"
        else
            mv "$folder" "$SUPABASE_DIR/"
        fi
    fi
done

# Move files
echo "📄 Moving files to $SUPABASE_DIR..."
for file in "${FILES_TO_MOVE[@]}"; do
    if [ -f "$file" ]; then
        echo "Moving $file..."
        mv "$file" "$SUPABASE_DIR/"
    fi
done

# Remove node_modules and .mypy_cache if they exist
echo "🧹 Cleaning up unnecessary directories..."
[ -d node_modules ] && rm -rf node_modules
[ -d .mypy_cache ] && rm -rf .mypy_cache

echo "✅ Folder organization complete"
echo "📋 Remaining items:"
ls -1
