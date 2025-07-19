#!/bin/bash

# Ensure Supabase is running
supabase start

# Set Supabase environment variables for local testing
export SUPABASE_URL="http://127.0.0.1:54321"
export SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
export FRONTEND_URL="http://localhost:5173"

# Run the Deno test with configuration
deno test \
  --config=deno.json \
  --trace-leaks \
  --no-check \
  --allow-net \
  --allow-read \
  --allow-write \
  --allow-env \
  tests/functions/user_invitation.test.ts \
  -- -v 