#!/bin/bash

# Supabase Backend Environment Setup Script
# Run this from the ogettootachi-supabase-instance directory

echo "🔧 Setting up Supabase Backend Environment Variables..."

# Check if we're in the right directory
if [ ! -f "config.toml" ]; then
    echo "❌ Error: Please run this script from the ogettootachi-supabase-instance directory"
    exit 1
fi

echo ""
echo "🌍 Choose your environment:"
echo "1) Local Development"
echo "2) Production"
read -p "Enter choice (1 or 2): " env_choice

if [ "$env_choice" = "1" ]; then
    echo ""
    echo "🏠 Setting up LOCAL DEVELOPMENT environment..."
    echo ""
    echo "Setting Edge Function secrets for local development:"
    
    # Local development keys (these are the default local Supabase keys)
    supabase secrets set SUPABASE_URL="http://127.0.0.1:54321"
    supabase secrets set SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
    
    # You'll need to set your own OpenAI API key
    read -p "Enter your OpenAI API Key (for chatbot features): " openai_key
    if [ ! -z "$openai_key" ]; then
        supabase secrets set OPENAI_API_KEY="$openai_key"
    else
        echo "⚠️  Skipping OpenAI API Key - chatbot features won't work"
    fi
    
    echo ""
    echo "✅ Local development secrets set!"
    
elif [ "$env_choice" = "2" ]; then
    echo ""
    echo "🚀 Setting up PRODUCTION environment..."
    echo ""
    echo "You'll need to get these values from your Supabase dashboard:"
    echo "Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api"
    echo ""
    
    read -p "Enter your Production Supabase URL: " prod_url
    read -p "Enter your Production Anon Key: " prod_anon
    read -p "Enter your Production Service Role Key: " prod_service
    read -p "Enter your OpenAI API Key: " openai_key
    
    if [ ! -z "$prod_url" ] && [ ! -z "$prod_anon" ] && [ ! -z "$prod_service" ]; then
        supabase secrets set SUPABASE_URL="$prod_url"
        supabase secrets set SUPABASE_ANON_KEY="$prod_anon"
        supabase secrets set SUPABASE_SERVICE_ROLE_KEY="$prod_service"
        
        if [ ! -z "$openai_key" ]; then
            supabase secrets set OPENAI_API_KEY="$openai_key"
        fi
        
        echo ""
        echo "✅ Production secrets set!"
    else
        echo "❌ Missing required production values"
        exit 1
    fi
else
    echo "❌ Invalid choice"
    exit 1
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