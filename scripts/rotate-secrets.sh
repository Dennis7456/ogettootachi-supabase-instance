#!/bin/bash

# Rotate Supabase and API keys
supabase secrets set SUPABASE_ANON_KEY=$ANON_KEY
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY
supabase secrets set RESEND_API_KEY=$RESEND_API_KEY

# Rest of the script remains unchanged 