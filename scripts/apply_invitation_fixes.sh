#!/bin/bash

# Script to apply invitation system fixes
echo "Applying invitation system fixes..."

# Navigate to the Supabase project directory
cd "$(dirname "$0")/.."

# Check if Supabase is running
if ! supabase status | grep -q "Started"; then
  echo "Supabase is not running. Starting Supabase..."
  supabase start
fi

# Apply migrations
echo "Applying migrations..."

# Apply all pending migrations
echo "Applying all pending migrations..."
supabase db push --local

echo "All invitation system fixes applied successfully!"
echo "You can now test the invitation system." 