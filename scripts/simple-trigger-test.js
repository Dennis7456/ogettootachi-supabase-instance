/* eslint-disable no-console, no-undef, no-unused-vars */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabaseService = createClient(supabaseUrl, supabaseServiceKey);

// Utility function for logging errors
const logError = (prefix, error) => {
  if (error) {
    console.error(`❌ ${prefix}:`, error.message);
  }
};

async function testTrigger() {
  const _testEmail = `trigger-test-${Date.now()}@example.com`;
  try {
    const { _data: _userData, _error: _userError } =
      await _supabaseService.auth.admin.createUser({
        email: _testEmail,
        password: 'testPassword123',
        email_confirm: true,
        user_metadata: {
          full_name: 'Trigger Test User',
          role: 'user',
        },
      });
    
    logError('User creation error', _userError);
    if (_userError) return;

    // Step 2: Immediately check for profile
    const { _data: _profile, _error: _profileError } = await _supabaseService
      .from('profiles')
      .select('*')
      .eq('id', _userData.user.id)
      .single();

    if (_profileError) {
      // Step 3: Check if user exists in auth.users
      const { _data: _authUser, _error: _authError } = await _supabaseService
        .from('auth.users')
        .select('id, email, raw_user_meta_data')
        .eq('id', _userData.user.id)
        .single();
      
      logError('Auth user check error', _authError);

      // Step 4: Try to manually create profile
      const { _data: _manualProfile, _error: _manualError } =
        await _supabaseService
          .from('profiles')
          .insert({
            id: _userData.user.id,
            full_name: 'Trigger Test User',
            role: 'user',
            is_active: true,
          })
          .select()
          .single();
      
      logError('Manual profile creation error', _manualError);
    }

    // Step 5: Clean up - delete the test user
    const { _error: _deleteError } =
      await _supabaseService.auth.admin.deleteUser(_userData.user.id);
    
    logError('User deletion error', _deleteError);

  } catch (_error) {
    console.error('❌ Test failed:', _error);
  }
}

testTrigger();
