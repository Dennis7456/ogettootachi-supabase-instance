import { createClient } from '@supabase/supabase-js';
import { setTimeout } from 'timers/promises';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration from environment variables with fallback
const _config = {
  SUPABASE_URL: process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
};

// Validate configuration
if (!_config.SUPABASE_ANON_KEY || !_config.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    '❌ Missing Supabase configuration. Please set SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in your .env file.'
  );
  process.exit(1);
}

// Rest of the existing test-invitation-system-complete.js code remains the same
// (The previous implementation you showed)
