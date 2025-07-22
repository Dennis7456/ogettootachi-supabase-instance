#!/bin/bash

# Secret Removal Script for Git History

# List of secrets to remove
SECRETS_TO_REMOVE=(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
)

# Paths to check for secrets
PATHS_TO_CHECK=(
    "scripts/test-invitation.sh"
    "ogettootachi-supabase-instance/scripts/run_user_invitation_test.sh"
    "ogettootachi-supabase-instance/scripts/test-invitation.sh"
)

# Create a file with secrets to remove
create_secrets_file() {
    local secrets_file=$(mktemp)
    for secret in "${SECRETS_TO_REMOVE[@]}"; do
        echo "$secret==>REMOVED_SUPABASE_KEY" >> "$secrets_file"
    done
    echo "$secrets_file"
}

# Remove secrets from repository history
remove_secrets_from_history() {
    local secrets_file=$(create_secrets_file)
    
    # Remove secrets from specified paths
    for path in "${PATHS_TO_CHECK[@]}"; do
        echo "Removing secrets from $path..."
        git filter-repo --path "$path" --replace-text "$secrets_file" --force
    done
    
    # Clean up temporary secrets file
    rm "$secrets_file"
}

# Rotate Supabase secrets
rotate_supabase_secrets() {
    echo "Rotating Supabase secrets..."
    # Generate new random secrets
    local ANON_KEY=$(openssl rand -base64 32)
    local SERVICE_ROLE_KEY=$(openssl rand -base64 32)
    
    # Create a .env file with new secrets
    cat > .env << EOL
SUPABASE_ANON_KEY=$ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
EOL
    
    echo "New secrets generated and saved to .env file"
}

# Set up remote origin
setup_remote_origin() {
    # Add the original repository as a remote
    git remote add origin file:///Users/denniskiplangat/Documents/law-firm-website/.git
    
    # Fetch from the original repository
    git fetch origin
    
    # Set the upstream branch
    git branch --set-upstream-to=origin/main main
}

# Main execution
main() {
    # Ensure we're in a git repository
    if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
        echo "Error: Not in a git repository"
        exit 1
    fi
    
    # Remove secrets from history
    remove_secrets_from_history
    
    # Rotate secrets
    rotate_supabase_secrets
    
    # Set up remote origin
    setup_remote_origin
    
    # Force push changes
    git push origin main --force
}

# Run the main function
main 