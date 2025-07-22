import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Debug logging function to replace console.log
function debugLog(...args) {
  if (process.env.DEBUG === 'true') {
    const timestamp = new Date().toISOString();
    const logMessage = args
      .map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
      .join(' ');
    process.stderr.write(`[DEBUG ${timestamp}] ${logMessage}\n`);
  }
}

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE';
const _supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listBucketsAsAdmin() {
  try {
    // Sign in as admin
    const { data: _authData, error: authError } =
      await _supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123456',
      });

    if (authError) {
      debugLog('❌ Auth error:', authError.message);
      return;
    }

    // List buckets
    const { data: buckets, error: bucketsError } =
      await _supabase.storage.listBuckets();

    if (bucketsError) {
      debugLog('❌ Error listing buckets:', bucketsError.message);
    } else {
      debugLog(
        '✅ Buckets visible to admin:',
        buckets.map(b => b.name)
      );
    }
  } catch (error) {
    debugLog('❌ Unexpected error:', error.message);
  }
}

listBucketsAsAdmin();
