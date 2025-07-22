import { createClient } from '@supabase/supabase-js';

// Debug logging function to replace console.log
function debugLog(...args) {
  if (process.env.DEBUG === 'true') {
    const timestamp = new Date().toISOString();
    const logMessage = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : arg
    ).join(' ');
    process.stderr.write(`[DEBUG ${timestamp}] ${logMessage}\n`);
  }
}

// Test login functionality
const supabaseUrl = 'https://riuqslalytzybvgsebki.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdXFzbGFseXR6eWJ2Z3NlYmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MzA0MDAsImV4cCI6MjA2NjMwNjQwMH0.SLbk4MgmS-DMpgCrHZOme9zolF_17SqvCFoKdgJtZWI';

const _supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  const testEmail = 'webmastaz2019@gmail.com';
  const testPassword = 'testpassword123'; // This will fail, but we'll see the specific error
  
  try {
    const { data: _loginData, error } = await _supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    
    if (error) {
      // Check specific error types
      if (error.message.includes('Invalid login credentials')) {
        debugLog('❌ Invalid login credentials');
      } else if (error.message.includes('Email not confirmed')) {
        debugLog('❌ Email not confirmed');
      } else if (error.message.includes('User not found')) {
        debugLog('❌ User not found');
      } else {
        debugLog('❌ Unexpected login error:', error.message);
      }
    } else {
      debugLog('✅ Login successful');
    }
  } catch (error) {
    debugLog('❌ Unexpected error:', error);
  }
}

testLogin();
