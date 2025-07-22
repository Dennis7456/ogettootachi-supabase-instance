#!/bin/bash

# Production Email Setup Script
# This script helps configure your Supabase Edge Functions for production email delivery

echo "🚀 Production Email Setup for Ogetto, Otachi & Company Advocates"
echo ""

# Check if we're in the right directory
if [ ! -f "config.toml" ]; then
    echo "❌ Error: Please run this script from the ogettootachi-supabase-instance directory"
    exit 1
fi

echo "📧 This script will help you set up production email delivery."
echo ""
echo "✅ **What you'll need:**"
echo "   1. Resend API key (from resend.com)"
echo "   2. Your production Supabase project URL" 
echo "   3. Your production Supabase service role key"
echo "   4. Your production website URL"
echo ""

read -p "Do you want to continue? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 1
fi

echo ""
echo "🔑 **Step 1: Resend API Key**"
echo "   1. Go to: https://resend.com"
echo "   2. Create account and verify your domain"
echo "   3. Get your API key (starts with 're_')"
echo ""
read -p "Enter your Resend API key: " RESEND_API_KEY

if [[ -z "$RESEND_API_KEY" ]]; then
    echo "❌ Error: Resend API key is required"
    exit 1
fi

echo ""
echo "🌐 **Step 2: Production URLs**"
echo ""
read -p "Enter your production Supabase URL (https://xxx.supabase.co): " SUPABASE_URL
read -p "Enter your production website URL (https://yourdomain.com): " FRONTEND_URL

if [[ -z "$SUPABASE_URL" || -z "$FRONTEND_URL" ]]; then
    echo "❌ Error: URLs are required"
    exit 1
fi

echo ""
echo "🔐 **Step 3: Service Role Key**"
echo "   Get this from: Supabase Dashboard > Settings > API"
echo ""
read -p "Enter your production service role key: " SERVICE_ROLE_KEY

if [[ -z "$SERVICE_ROLE_KEY" ]]; then
    echo "❌ Error: Service role key is required"
    exit 1
fi

echo ""
echo "✅ **Configuration Summary:**"
echo "   Resend API Key: ${RESEND_API_KEY:0:10}..."
echo "   Supabase URL: $SUPABASE_URL"
echo "   Frontend URL: $FRONTEND_URL"
echo "   Service Role Key: ${SERVICE_ROLE_KEY:0:20}..."
echo ""

read -p "Deploy these settings to production? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

echo ""
echo "🚀 **Deploying to Production...**"
echo ""

# Set secrets for Edge Functions
echo "📝 Setting Edge Function secrets..."

# Note: SUPABASE_URL is automatically provided by Supabase in Edge Functions
echo "Setting RESEND_API_KEY..."
supabase secrets set RESEND_API_KEY=$RESEND_API_KEY

echo "Setting SUPABASE_SERVICE_ROLE_KEY..."
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY

echo "Setting FRONTEND_URL..."
supabase secrets set FRONTEND_URL=$FRONTEND_URL

echo "✅ Secrets set successfully!"
echo "   Note: SUPABASE_URL is automatically provided by Supabase"

echo ""
echo "📦 Deploying Edge Functions..."

# Deploy the functions
supabase functions deploy handle-invitation
supabase functions deploy send-invitation-email

echo ""
echo "✅ **Production Email Setup Complete!**"
echo ""
echo "🎯 **Next Steps:**"
echo "1. Update your React app environment variables:"
echo "   VITE_SUPABASE_URL=$SUPABASE_URL"
echo "   VITE_SUPABASE_ANON_KEY=your_production_anon_key"
echo ""
echo "2. Test email delivery:"
echo "   - Deploy your React app to production"
echo "   - Send a test invitation to yourself"
echo "   - Check your email inbox"
echo ""
echo "3. Monitor email delivery:"
echo "   - Check Resend dashboard: https://resend.com/emails"
echo "   - Check Supabase logs: https://supabase.com/dashboard"
echo ""
echo "🎉 Your law firm's invitation system is production-ready!"
echo ""
echo "📧 **Professional Email Setup:**"
echo "   From: Ogetto, Otachi & Company <noreply@ogettootachi.com>"
echo "   Subject: You're Invited to Join Ogetto, Otachi & Company Advocates"
echo "   Professional branding and mobile-responsive design"
echo ""
echo "💡 **Need help?** Check PRODUCTION_EMAIL_SETUP.md for detailed instructions." 