#!/bin/bash

# Git Secret Cleanup Script

# Ensure BFG Repo-Cleaner is installed
check_bfg_installed() {
    if ! command -v bfg &> /dev/null; then
        echo "❌ BFG Repo-Cleaner not found. Installing..."
        brew install bfg
    fi
}

# Remove sensitive files from Git history
cleanup_git_history() {
    echo "🧹 Cleaning up Git history..."
    
    # Create a backup of the repository
    git clone --mirror file://$(git rev-parse --show-toplevel)/.git repo-backup.git
    
    # Create a file with patterns to remove
    cat > secrets-to-remove.txt << EOL
passwords
secrets
tokens
keys
api_keys
service_role_keys
anon_keys
EOL
    
    # Use BFG to remove sensitive files and patterns
    bfg --delete-files secrets-to-remove.txt repo-backup.git
    
    # Force push the cleaned repository
    cd repo-backup.git
    git reflog expire --expire=now --all && git gc --prune=now --aggressive
    git push --force
    
    # Clean up temporary files
    rm -rf ../secrets-to-remove.txt
    
    echo "✅ Git history cleaned successfully"
}

# Rotate all secrets after cleanup
rotate_secrets() {
    echo "🔄 Rotating all secrets..."
    
    # Add commands to rotate Supabase, OpenAI, and other API keys
    supabase secrets set SUPABASE_ANON_KEY=$(openssl rand -base64 32)
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$(openssl rand -base64 32)
    
    echo "✅ Secrets rotated"
}

# Main script execution
main() {
    check_bfg_installed
    cleanup_git_history
    rotate_secrets
}

# Run the main function
main 