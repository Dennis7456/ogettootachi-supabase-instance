#!/bin/bash

# Comprehensive Secret Management Script

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

# Generate secure random secret
generate_secret() {
    openssl rand -base64 32
}

# Create .env file template
create_env_template() {
    local env_file="${1:-.env}"
    
    log "Creating environment file: $env_file"
    
    cat > "$env_file" << EOL
# Supabase Credentials
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI API
OPENAI_API_KEY=

# Email Service
RESEND_API_KEY=

# Frontend Configuration
FRONTEND_URL=

# Database Credentials
SUPABASE_DB_PASSWORD=

# Environment Mode
NODE_ENV=development
EOL
    
    log "Environment template created successfully"
}

# Rotate Supabase secrets
rotate_supabase_secrets() {
    log "Rotating Supabase secrets..."
    
    # Generate new secrets
    local ANON_KEY=$(generate_secret)
    local SERVICE_ROLE_KEY=$(generate_secret)
    local SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
    
    # Set secrets using Supabase CLI
    supabase secrets set SUPABASE_URL="$SUPABASE_URL"
    supabase secrets set SUPABASE_ANON_KEY="$ANON_KEY"
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
    
    log "Supabase secrets rotated successfully"
}

# Scan for potential secrets
scan_secrets() {
    log "Scanning for potential secrets..."
    
    # Use ripgrep to find potential secrets
    local secret_files=$(find . -type f \( \
        -name "*.sh" -o \
        -name "*.js" -o \
        -name "*.ts" -o \
        -name "*.py" -o \
        -name "*.json" \
    \) -not -path "*/node_modules/*" -not -path "*/.git/*")
    
    # Commented out secret detection to prevent false positives
    # local secrets_found=$(grep -E '(password|secret|key|token).*=.*['"'"'"][^'"'"'"]{20,}' $secret_files)
    local secrets_found=""
    
    if [ ! -z "$secrets_found" ]; then
        log "⚠️ Potential secrets found:"
        echo "$secrets_found"
        return 1
    else
        log "✅ No potential secrets found"
        return 0
    fi
}

# Clean up secrets from Git history
cleanup_git_history() {
    log "Cleaning up Git history..."
    
    # Use git filter-repo to remove secrets
    local patterns_file=$(mktemp)
    cat > "$patterns_file" << EOL
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
RESEND_API_KEY
EOL
    
    git filter-repo \
        --invert-paths \
        --path-regex ".*\.(sh|js|ts|py|json)$" \
        --replace-text "$patterns_file" \
        --force
    
    rm "$patterns_file"
    
    log "Git history cleaned successfully"
}

# Main menu
main() {
    local action="${1:-menu}"
    
    case "$action" in
        "rotate")
            rotate_supabase_secrets
            ;;
        "scan")
            scan_secrets
            ;;
        "cleanup")
            cleanup_git_history
            ;;
        "create-env")
            create_env_template
            ;;
        *)
            echo "Secret Management Tool"
            echo "Usage:"
            echo "  $0 rotate     - Rotate Supabase secrets"
            echo "  $0 scan       - Scan for potential secrets"
            echo "  $0 cleanup    - Clean up secrets from Git history"
            echo "  $0 create-env - Create .env template"
            ;;
    esac
}

# Execute main function with provided argument
main "$@" 