/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';

const _supabaseUrl = 'http://127.0.0.1:54321';
const _supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const _supabase = createClient(_supabaseUrl, _supabaseServiceKey);

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

async function clearAllUsers() {
  try {
    // First, delete all profiles
    const { _error: _profilesError } = await _supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Avoid deleting any system reserved profiles

    _logError('Error deleting profiles', _profilesError);

    if (_profilesError) {
      return false;
    }

    // Then, delete all users
    const { _data: _users, _error: _listError } = await _supabase.auth.admin.listUsers();

    _logError('Error listing users', _listError);

    if (_listError) {
      return false;
    }

    const _deletionResults = [];

    for (const _user of _users.users) {
      // Skip system users or special accounts if needed
      if (_user.email === 'service@_supabase.com') {
        continue;
      }

      const { _error } = await _supabase.auth.admin.deleteUser(_user.id);

      if (_error) {
        console.error(`❌ Failed to delete user ${_user.email}:`, _error);
        _deletionResults.push({ email: _user.email, deleted: false, _error });
      } else {
        _deletionResults.push({ email: _user.email, deleted: true });
      }
    }

    console.log(`Successfully Deleted: ${_deletionResults.filter((_r) => _r.deleted).length}`);
    console.log(`Failed Deletions: ${_deletionResults.filter((_r) => !_r.deleted).length}`);

    return true;
  } catch (_error) {
    console.error('❌ Unexpected error during cleanup:', _error);
    return false;
  }
}

// If run directly
if (import.meta.main) {
  clearAllUsers().then((_success) => {
    process.exit(_success ? 0 : 1);
  });
}

export { clearAllUsers };
