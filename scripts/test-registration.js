import { createClient } from '@supabase/supabase-js';
import Deno from 'deno';

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

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const _supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const _supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function testRegistration() {
  try {
    // Generate a unique test email
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    // Step 1: Sign Up
    const { data: signUpData, error: signUpError } = await _supabaseAnon.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: 'Test User',
          role: 'user',
        },
      },
    });
    if (signUpError) {
      debugLog('❌ Sign Up Error:', signUpError);
      return false;
    }
    // Step 2: Manually create profile using service role
    const { data: _profile, error: profileError } = await _supabaseService
      .from('profiles')
      .upsert(
        {
          id: signUpData.user.id,
          full_name: 'Test User',
          role: 'user',
          is_active: true,
        },
        {
          onConflict: 'id',
        }
      )
      .select()
      .single();
    if (profileError) {
      debugLog('❌ Profile Creation Error:', profileError);
      return false;
    }
    return true;
  } catch (error) {
    debugLog('❌ Unexpected Error:', error);
    return false;
  }
}
// If run directly
if (import.meta.main) {
  testRegistration().then((success) => {
    Deno.exit(success ? 0 : 1);
  });
}
export { testRegistration };
