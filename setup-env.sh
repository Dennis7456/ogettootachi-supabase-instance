#!/bin/bash

# Supabase Backend Environment Setup Script
# Run this from the ogettootachi-supabase-instance directory

echo "🔧 Setting up Supabase Backend Environment Variables..."

# Load environment variables
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check if running in development or production
if [ "$ENV" = "production" ]; then
    supabase secrets set SUPABASE_URL="$PROD_SUPABASE_URL"
    supabase secrets set SUPABASE_ANON_KEY="$PROD_SUPABASE_ANON_KEY"
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$PROD_SUPABASE_SERVICE_ROLE_KEY"
    supabase secrets set OPENAI_API_KEY="$PROD_OPENAI_API_KEY"
else
    supabase secrets set SUPABASE_URL="http://127.0.0.1:54321"
    supabase secrets set SUPABASE_ANON_KEY="$DEV_SUPABASE_ANON_KEY"
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$DEV_SUPABASE_SERVICE_ROLE_KEY"
    supabase secrets set OPENAI_API_KEY="$DEV_OPENAI_API_KEY"
fi

echo ""
echo "📋 Current secrets:"
supabase secrets list

echo ""
echo "🎯 Next steps:"
echo "1. Deploy your Edge Functions: supabase functions deploy"
echo "2. Test your functions with the React app"
echo ""
echo "📚 Your Edge Functions will automatically use these environment variables!" 