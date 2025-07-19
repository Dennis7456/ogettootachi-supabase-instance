#!/bin/bash

# Ensure Supabase is running
supabase start

# Get Supabase credentials from local development
SUPABASE_URL=$(supabase status | grep "API URL" | awk '{print $3}')
SUPABASE_ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')
SUPABASE_SERVICE_ROLE_KEY=$(supabase status | grep "service_role key" | awk '{print $3}')
FRONTEND_URL="http://localhost:5173"

# Set environment variables for test
export SUPABASE_URL
export SUPABASE_ANON_KEY
export SUPABASE_SERVICE_ROLE_KEY
export FRONTEND_URL

# Run Deno tests
deno test tests/functions/user_invitation.test.ts \
  --allow-net \
  --allow-read \
  --allow-write \
  --allow-env

# Optional: Clean up Supabase instance after tests
# supabase stop
