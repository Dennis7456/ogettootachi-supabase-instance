#!/bin/bash

# Test Invitation Sending Script

# Supabase local development URL and anon key
SUPABASE_URL="http://localhost:54321"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Test invitation details
EMAIL="test_user@example.com"
ROLE="staff"
DEPARTMENT="IT"
CUSTOM_MESSAGE="Welcome to the team! We're excited to have you join us."

# Send invitation using curl
curl -X POST "http://localhost:54321/functions/v1/handle-invitation" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d "{
    \"email\": \"$EMAIL\",
    \"role\": \"$ROLE\",
    \"department\": \"$DEPARTMENT\",
    \"custom_message\": \"$CUSTOM_MESSAGE\",
    \"full_name\": \"Test User\"
  }"

echo -e "\n\n🚀 Invitation test complete. Check Mailhog at http://localhost:8025" 