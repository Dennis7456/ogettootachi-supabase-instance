/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Production Supabase URL
const _supabaseUrl = 'https://riuqslalytzybvgsebki.supabase.co';
const _supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

if (!_supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  console.error(
    'Please set your production service role key in your .env file'
  );
  throw new Error('Process exit blocked');
}

const _supabase = createClient(_supabaseUrl, _supabaseServiceKey);

async function fixProductionProfile() {
  const _userId = '71b37539-336f-491c-9a10-b4c0d6e3ad7b';

  try {
    // First, check if the user exists in auth.users
    const { _data: _userData, _error: _userError } =
      await _supabase.auth.admin.getUserById(_userId);

    _logError('Error fetching user from auth.users', _userError);

    if (_userError || !_userData.user) {
      console.error('User not found in auth.users table');
      return;
    }

    const _userDetails = {
      id: _userData.user.id,
      email: _userData.user.email,
      email_confirmed: _userData.user.email_confirmed_at,
      created_at: _userData.user.created_at,
      user_metadata: _userData.user.user_metadata,
    };

    console.log('User Details:', _userDetails);

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
        full_name:
          _userData.user.user_metadata?.full_name ||
          _userData.user.user_metadata?.first_name ||
          _userData.user.user_metadata?.last_name ||
          _userData.user.email?.split('@')[0] ||
          'Admin User',
        role: _userData.user.user_metadata?.role || 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    _logError('Error creating profile', _insertError);

    if (_newProfile) {
      console.log('✅ Profile fix completed! The user should now be able to log in.');
      console.log('New Profile:', _newProfile);
    }
  } catch (_error) {
    console.error('Unexpected error:', _error);
  }
}

// Instructions for running this script
console.log('This script will create a missing profile for the user experiencing the 406 error.');
console.log('1. Make sure you have the production SUPABASE_SERVICE_ROLE_KEY in your .env file');
console.log('Make sure you have the correct service role key and understand what this script does.');

// Check if we should run the script
const _shouldRun = process.argv.includes('--run');

if (_shouldRun) {
  fixProductionProfile();
} else {
  console.log('Script not run. Use --run flag to execute.');
}
