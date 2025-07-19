#!/bin/bash

# Deno and Test Environment Diagnostics

echo "=== System Information ==="
echo "OS: $(uname -a)"
echo "Deno version: $(deno --version)"
echo "Supabase CLI version: $(supabase --version)"

echo -e "\n=== Deno Configuration ==="
cat deno.json

echo -e "\n=== Environment Variables ==="
echo "SUPABASE_URL: $SUPABASE_URL"
echo "SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY:0:10}..."
echo "SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:10}..."

echo -e "\n=== Deno Cache Information ==="
deno info

echo -e "\n=== Checking Deno Standard Library Imports ==="
deno run --allow-net --allow-read https://deno.land/std@0.182.0/testing/mod.ts
deno run --allow-net --allow-read https://deno.land/std@0.182.0/assert/mod.ts

echo -e "\n=== Attempting to Fetch Imports ==="
curl -I https://deno.land/std@0.182.0/testing/mod.ts
curl -I https://deno.land/std@0.182.0/assert/mod.ts

echo -e "\n=== Deno Permissions Test ==="
deno run --allow-all https://deno.land/std@0.182.0/testing/mod.ts

echo -e "\n=== Diagnostic Complete ===" 