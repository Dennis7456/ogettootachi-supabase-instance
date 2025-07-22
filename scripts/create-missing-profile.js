/* eslint-disable no-console, no-undef */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const _supabaseUrl =
  process.env.SUPABASE_URL || 'https://riuqslalytzybvgsebki._supabase.co';
const _supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!_supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  throw new Error('Process exit blocked');
}

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

const _supabase = createClient(_supabaseUrl, _supabaseServiceKey);

async function createMissingProfile() {
  const _userId = '71b37539-336f-491c-9a10-b4c0d6e3ad7b';

  try {
    // First, get the user from auth.users
    const { _data: _user, _error: _userError } =
      await _supabase.auth.admin.getUserById(_userId);

    _logError('Error fetching user', _userError);

    if (_userError) {
      return;
    }

    if (!_user.user) {
      console.error('User not found');
      return;
    }

    // Check if profile already exists
    const { _data: _existingProfile, _error: _profileError } = await _supabase
      .from('profiles')
      .select('*')
      .eq('id', _userId)
      .single();

    _logError('Error checking existing profile', _profileError);

    if (_profileError && _profileError.code !== 'PGRST116') {
      return;
    }

    if (_existingProfile) {
      console.log('Profile already exists');
      return;
    }

    // Create the profile
    const { _data: _newProfile, _error: _insertError } = await _supabase
      .from('profiles')
      .insert({
        id: _userId,
        first_name:
          _user.user.user_metadata?.first_name ||
          _user.user.user_metadata?.full_name?.split(' ')[0] ||
          '',
        last_name:
          _user.user.user_metadata?.last_name ||
          _user.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ||
          '',
        email: _user.user.email,
        role: _user.user.user_metadata?.role || 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    _logError('Error creating profile', _insertError);

    if (_insertError) {
      return;
    }

    console.log('Profile created successfully');
  } catch (_error) {
    console.error('Unexpected error:', _error);
  }
}

createMissingProfile();
