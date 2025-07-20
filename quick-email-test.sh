#!/bin/bash

# Quick Email Test Script
# This script helps you start services and access invitation emails

echo "🚀 Starting Email Testing Environment..."
echo ""

# Check if we're in the right directory
if [ ! -f "config.toml" ]; then
    echo "❌ Error: Please run this script from the ogettootachi-supabase-instance directory"
    exit 1
fi

# Start Supabase services
echo "📦 Starting Supabase services..."
supabase start

# Wait a moment for services to fully start
echo "⏳ Waiting for services to initialize..."
sleep 3

# Check if services are running
echo ""
echo "🔍 Checking service status..."
supabase status

echo ""
echo "✅ Email testing environment is ready!"
echo ""
echo "📧 **How to Access Emails:**"
echo ""
echo "1. **Inbucket (Email Viewer):**"
echo "   🌐 http://127.0.0.1:54324"
echo "   📝 All invitation emails will appear here instantly"
echo ""
echo "2. **Supabase Studio:**"
echo "   🌐 http://127.0.0.1:54323"
echo "   📊 Database and auth logs"
echo ""
echo "3. **Test Invitation Form:**"
echo "   🌐 http://localhost:5173/test-invitation"
echo "   📝 Send test invitations here"
echo ""
echo "🎯 **Quick Test Steps:**"
echo "1. Open: http://127.0.0.1:54324 (Inbucket)"
echo "2. Open: http://localhost:5173/test-invitation (Test Form)"
echo "3. Send invitation with any email (e.g., test@example.com)"
echo "4. Check Inbucket - email appears instantly!"
echo ""
echo "🔧 **To stop services later:**"
echo "   supabase stop"
echo ""

# Try to open Inbucket in browser (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🌐 Opening Inbucket in your browser..."
    open http://127.0.0.1:54324
fi

echo "✨ Happy testing!" 