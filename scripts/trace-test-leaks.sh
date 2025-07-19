#!/bin/bash

# Script to trace Deno test leaks

echo "=== Tracing Deno Test Leaks ==="

# Run tests with leak tracing and no type checking
deno test tests/functions/user_invitation.test.ts \
  --trace-leaks \
  --no-check \
  --allow-net \
  --allow-read \
  --allow-write \
  --allow-env

echo -e "\n=== Leak Trace Complete ==="

# Optional: Run with more verbose output
echo -e "\n=== Verbose Test Run ==="
deno test tests/functions/user_invitation.test.ts \
  --trace-leaks \
  --no-check \
  --allow-net \
  --allow-read \
  --allow-write \
  --allow-env \
  -- -v
