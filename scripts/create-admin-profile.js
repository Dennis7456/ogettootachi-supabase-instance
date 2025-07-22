/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';

// Script to create admin profile manually
// Local Supabase configuration
const _supabaseUrl = 'http://127.0.0.1:54321';
const _supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

async function createAdminProfile() {
  try {
    // Create service role client
    const _supabase = createClient(_supabaseUrl, _supabaseServiceKey);

    // First, let's find the user
    const { _data: _users, _error: _usersError } =
      await _supabase.auth.admin.listUsers();

    _logError('Failed to list users', _usersError);
    
    if (_usersError) {
      return false;
    }

    // Find the admin user
    const _adminUser = _users.users.find(
      _user => _user.email === 'admin@example.com'
    );

    if (!_adminUser) {
      console.error('❌ Admin user not found');
      return false;
    }

    // Check if profile already exists
    const { _data: _existingProfile, _error: _profileError } = await _supabase
      .from('profiles')
      .select('*')
      .eq('id', _adminUser.id)
      .single();

    _logError('Profile check failed', _profileError);
    
    if (_profileError && _profileError.code !== 'PGRST116') {
      return false;
    }

    if (_existingProfile) {
      console.log('Admin profile already exists');
      return true;
    }

    // Create the profile
    const { _data: _newProfile, _error: _createError } = await _supabase
      .from('profiles')
      .insert({
        id: _adminUser.id,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        is_active: true,
      })
      .select()
      .single();

    _logError('Profile creation failed', _createError);
    
    if (_createError) {
      return false;
    }

    console.log('Admin profile created successfully');
    return true;
  } catch (_error) {
    console.error('❌ Script failed:', _error);
    return false;
  }
}

// Run the script
createAdminProfile().then(_success => {
  if (_success) {
    console.log('Admin profile creation process completed successfully');
  } else {
    console.log('Admin profile creation process failed');
  }
});
