#!/bin/bash

# Diagnostic script for Supabase and Deno test environment

echo "=== System Information ==="
echo "OS: $(uname -a)"
echo "Deno version: $(deno --version)"
echo "Supabase CLI version: $(supabase --version)"

echo -e "\n=== Supabase Local Development Status ==="
supabase status

echo -e "\n=== Environment Variables ==="
echo "SUPABASE_URL: $SUPABASE_URL"
echo "SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:10}..."
echo "SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:10}..."
echo "FRONTEND_URL: $FRONTEND_URL"

echo -e "\n=== Deno Test Configuration ==="
cat deno.json

echo -e "\n=== Running Deno Type Check ==="
deno check tests/functions/user_invitation.test.ts

echo -e "\n=== Attempting to Run Tests with No Type Check ==="
deno test tests/functions/user_invitation.test.ts --no-check

echo -e "\n=== Diagnostic Complete ==="
