#!/bin/bash

# Strict error handling
set -euo pipefail

# Logging function
log() {
    local level="$1"
    local message="$2"
    local timestamp
    timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    
    case "$level" in
        INFO)
            echo "[INFO] $timestamp - $message"
            ;;
        WARN)
            echo "[WARN] $timestamp - $message" >&2
            ;;
        ERROR)
            echo "[ERROR] $timestamp - $message" >&2
            exit 1
            ;;
    esac
}

# Validate required environment variables
validate_env_vars() {
    local vars=("$@")
    for var in "${vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log ERROR "$var is not set. Please configure this environment variable."
        fi
    done
}

# Generate secure random keys
generate_secure_key() {
    local length="${1:-32}"
    openssl rand -base64 "$length"
}

# Rotate Supabase keys
rotate_supabase_keys() {
    local env_type="${1:-dev}"
    
    log INFO "Rotating Supabase keys for $env_type environment"
    
    # Generate new keys
    local new_anon_key
    local new_service_role_key
    local new_url
    
    new_anon_key=$(generate_secure_key)
    new_service_role_key=$(generate_secure_key)
    
    # Use different URL for production and development
    if [[ "$env_type" == "prod" ]]; then
        new_url="${PROD_SUPABASE_URL:-}"
        validate_env_vars "PROD_SUPABASE_URL"
    else
        new_url="${DEV_SUPABASE_URL:-http://127.0.0.1:54321}"
    fi
    
    # Set new secrets
    supabase secrets set SUPABASE_URL="$new_url"
    supabase secrets set SUPABASE_ANON_KEY="$new_anon_key"
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$new_service_role_key"
    
    log INFO "Supabase keys rotated successfully"
}

# Rotate API keys
rotate_api_keys() {
    local env_type="${1:-dev}"
    
    log INFO "Rotating API keys for $env_type environment"
    
    # Rotate OpenAI API key
    local new_openai_key
    new_openai_key=$(generate_secure_key 48)
    
    # Rotate Resend API key
    local new_resend_key
    new_resend_key=$(generate_secure_key 48)
    
    supabase secrets set OPENAI_API_KEY="$new_openai_key"
    supabase secrets set RESEND_API_KEY="$new_resend_key"
    
    log INFO "API keys rotated successfully"
}

# Main execution
main() {
    local env_type="${1:-dev}"
    
    # Validate base environment variables
    validate_env_vars \
        "DEV_SUPABASE_URL" \
        "DEV_SUPABASE_ANON_KEY" \
        "DEV_SUPABASE_SERVICE_ROLE_KEY" \
        "DEV_OPENAI_API_KEY"
    
    # Rotate keys
    rotate_supabase_keys "$env_type"
    rotate_api_keys "$env_type"
    
    log INFO "Secret rotation completed successfully"
}

# Run the script
main "$@" 