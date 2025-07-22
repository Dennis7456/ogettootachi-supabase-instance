#!/bin/bash

# Validate required environment variables
validate_env_vars() {
    local vars=("$@")
    for var in "${vars[@]}"; do
        if [[ -z "${!var}" ]]; then
            echo "❌ Error: $var is not set. Please set this environment variable."
            exit 1
        fi
    done
}

# Production Environment Setup
setup_production_secrets() {
    validate_env_vars \
        PROD_SUPABASE_URL \
        PROD_SUPABASE_ANON_KEY \
        PROD_SUPABASE_SERVICE_ROLE_KEY \
        PROD_OPENAI_API_KEY

    supabase secrets set SUPABASE_URL=$PROD_SUPABASE_URL
    supabase secrets set SUPABASE_ANON_KEY=$PROD_SUPABASE_ANON_KEY
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$PROD_SUPABASE_SERVICE_ROLE_KEY
    supabase secrets set OPENAI_API_KEY=$PROD_OPENAI_API_KEY
}

# Development Environment Setup
setup_development_secrets() {
    validate_env_vars \
        DEV_SUPABASE_URL \
        DEV_SUPABASE_ANON_KEY \
        DEV_SUPABASE_SERVICE_ROLE_KEY \
        DEV_OPENAI_API_KEY

    supabase secrets set SUPABASE_URL=http://127.0.0.1:54321
    supabase secrets set SUPABASE_ANON_KEY=$DEV_SUPABASE_ANON_KEY
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$DEV_SUPABASE_SERVICE_ROLE_KEY
    supabase secrets set OPENAI_API_KEY=$DEV_OPENAI_API_KEY
}

# Main execution
main() {
    local env_type="${1:-dev}"

    case "$env_type" in
        prod)
            setup_production_secrets
            ;;
        dev)
            setup_development_secrets
            ;;
        *)
            echo "❌ Invalid environment. Use 'dev' or 'prod'."
            exit 1
            ;;
    esac
}

main "$@" 