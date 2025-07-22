#!/bin/bash

# Strict error handling
set -euo pipefail

# Validate Supabase keys
validate_supabase_keys() {
    local anon_key=${SUPABASE_ANON_KEY:-}
    local service_role_key=${SUPABASE_SERVICE_ROLE_KEY:-}

    if [[ -z "$anon_key" ]]; then
        echo "❌ Error: SUPABASE_ANON_KEY is not set"
        exit 1
    fi

    if [[ -z "$service_role_key" ]]; then
        echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY is not set"
        exit 1
    fi
}

# Run invitation tests
run_invitation_tests() {
    validate_supabase_keys

    # Redact keys in logs
    curl -X POST \
        -H "Content-Type: application/json" \
        -H "apikey: [REDACTED]" \
        -H "Authorization: Bearer [REDACTED]" \
        "$INVITATION_API_ENDPOINT"
}

# Main execution
main() {
    # Optional: Load environment from .env file if it exists
    if [[ -f .env ]]; then
        set -a
        source .env
        set +a
    fi

    run_invitation_tests
}

main "$@" 