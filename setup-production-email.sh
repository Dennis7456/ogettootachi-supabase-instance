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

# Setup Production Email Configuration
setup_production_email() {
    validate_env_vars \
        RESEND_API_KEY \
        SERVICE_ROLE_KEY \
        FRONTEND_URL

    # Set Supabase and email-related secrets
    supabase secrets set RESEND_API_KEY=$RESEND_API_KEY
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
    supabase secrets set FRONTEND_URL=$FRONTEND_URL
}

# Main execution
main() {
    setup_production_email
}

main "$@" 