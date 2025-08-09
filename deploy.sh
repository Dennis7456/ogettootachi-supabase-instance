#!/bin/bash

# Deploy script for Supabase migrations
# Usage: ./deploy.sh

echo "Deploying Supabase migrations..."

# Set your database password here
export POSTGRES_PASSWORD="your_database_password_here"

# Run the migration
npx supabase db push --include-all

echo "Deployment complete!"
