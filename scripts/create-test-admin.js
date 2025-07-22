import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

// Debug logging function to replace console.log
function debugLog(...args) {
  if (process.env.DEBUG === 'true') {
    const timestamp = new Date().toISOString();
    const logMessage = args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
      .join(' ');
    process.stderr.write(`[DEBUG ${timestamp}] ${logMessage}\n`);
  }
}

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestAdmin() {
  try {
    // Create a test admin user
    const { data: userData, error: userError } =
      await _supabase.auth.admin.createUser({
        email: 'admin@test.com',
        password: 'admin123456',
        email_confirm: true,
        user_metadata: {
          full_name: 'Test Admin',
          role: 'admin',
        },
      });

    if (userError) {
      debugLog('❌ Error creating user:', userError.message);
      return;
    }

    // Create admin profile
    const { data: _profileData, error: profileError } = await _supabase
      .from('profiles')
      .insert({
        id: userData.user.id,
        full_name: 'Test Admin',
        role: 'admin',
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      debugLog('❌ Error creating profile:', profileError.message);
      return;
    }

    debugLog('✅ Test admin created successfully');
  } catch (error) {
    debugLog('❌ Unexpected error:', error.message);
  }
}

createTestAdmin();
