/* eslint-disable no-console, no-undef, no-unused-vars */
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

const _supabase = createClient(_supabaseUrl, _supabaseServiceKey);

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

async function checkUserExists() {
  const _email = 'webmastaz2019@gmail.com';

  try {
    // Check auth.users table
    const { _data: _authUser, _error: _authError } =
      await _supabase.auth.admin.listUsers();

    _logError('Error fetching auth users', _authError);

    const _user = _authUser.users.find((_u) => _u.email === _email);

    if (!_user) {
      _authUser.users.forEach((_u, _index) => {
        console.log(
          `User ${_index + 1}: ${_u.email} (${_u.email_confirmed_at ? 'confirmed' : 'not confirmed'})`
        );
      });
      return;
    }

    console.log(`Email confirmed: ${_user.email_confirmed_at ? 'Yes' : 'No'}`);

    // Check profiles table
    const { _data: _profile, _error: _profileError } = await _supabase
      .from('profiles')
      .select('*')
      .eq('id', _user.id)
      .single();

    _logError('Profile fetch error', _profileError);

    if (_profile) {
      console.log('User profile details:', _profile);
    } else {
      console.log('No profile found for this user');
    }
  } catch (_error) {
    console.error('Error checking user:', _error);
  }
}

checkUserExists();
