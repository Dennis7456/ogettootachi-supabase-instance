#!/bin/bash

# Rotate Supabase Secrets Safely
# Usage: ./rotate-secrets.sh [environment]

set -e

# Validate input
ENVIRONMENT=${1:-local}

# Function to generate a secure random token
generate_token() {
    openssl rand -base64 32
}

# Supabase CLI check
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not installed. Please install it first."
    exit 1
}

# Confirm rotation
read -p "🔐 Are you sure you want to rotate secrets for $ENVIRONMENT? (y/N) " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ Secret rotation cancelled."
    exit 1
}

# Generate new secrets
ANON_KEY=$(generate_token)
SERVICE_ROLE_KEY=$(generate_token)
RESEND_API_KEY=$(generate_token)

# Rotate Supabase secrets
echo "🔄 Rotating Supabase secrets..."
supabase secrets set SUPABASE_ANON_KEY="$ANON_KEY"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$SERVICE_ROLE_KEY"
supabase secrets set RESEND_API_KEY="$RESEND_API_KEY"

# Update .env file
echo "📝 Updating .env file..."
sed -i '' "s/^SUPABASE_ANON_KEY=.*/SUPABASE_ANON_KEY=$ANON_KEY/" .env
sed -i '' "s/^SUPABASE_SERVICE_ROLE_KEY=.*/SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY/" .env
sed -i '' "s/^RESEND_API_KEY=.*/RESEND_API_KEY=$RESEND_API_KEY/" .env

echo "✅ Secret rotation completed successfully for $ENVIRONMENT"
echo "🚨 IMPORTANT: Update all dependent services and restart applications!"
