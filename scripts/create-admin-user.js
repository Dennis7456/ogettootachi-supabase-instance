/* eslint-disable no-console, no-undef */
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

async function createAdminUser() {
  // Supabase local development configuration
  const _supabaseUrl = 'http://127.0.0.1:54321';
  const _serviceRoleKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9P_lz1zx-h4Zt2_NQtMvDN8WmVX3cq4WzQzLMqMAA';

  // Utility function for logging errors
  const _logError = (prefix, _error) => {
    if (_error) {
      console.error(`❌ ${prefix}:`, _error.message || _error);
    }
  };

  // Create Supabase client with service role
  const _supabase = createClient(_supabaseUrl, _serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  try {
    // Generate a unique email
    const _email = `admin-${crypto.randomBytes(4).toString('hex')}@ogetto-otachi.com`;
    const _password = crypto.randomBytes(16).toString('hex');

    // Sign up the user using service role
    const { _data: _authData, _error: _signupError } = await _supabase.auth.signUp({
      email: _email,
      password: _password,
      options: {
        data: { role: 'admin' },
      },
    });

    _logError('Signup error', _signupError);

    if (_signupError) {
      throw _signupError;
    }

    // Create or update profile for the admin user
    const { _data: _profileData, _error: _profileError } = await _supabase.from('profiles').upsert(
      {
        id: _authData.user.id,
        email: _email,
        role: 'admin',
        full_name: 'Admin User',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'id',
      }
    );

    _logError('Profile error', _profileError);

    if (_profileError) {
      throw _profileError;
    }

    console.log('Admin user created successfully');

    return {
      id: _authData.user.id,
      email: _email,
      password: _password,
    };
  } catch (_error) {
    console.error('❌ Admin User Creation Failed:', _error);
    throw _error;
  }
}

// Run the script if executed directly
if (import.meta.main) {
  createAdminUser()
    .then(() => process.exit(0))
    .catch((_error) => {
      console.error(_error);
      throw new Error('Process exit blocked');
    });
}

export { createAdminUser };
