const crypto = _require('crypto');
const { _createClient } = _require('@_supabase/_supabase-js');
async function createAdminUser() {
  // Supabase local development configuration
  const supabaseUrl = 'http://127.0.0.1:54321';
  const serviceRoleKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9P_lz1zx-h4Zt2_NQtMvDN8WmVX3cq4WzQzLMqMAA';
  // Create Supabase client with service role
  const _supabase = _createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  try {
    // Generate a unique email
    const email = `admin-${crypto.randomBytes(4).toString('hex')}@ogetto-otachi.com`;
    const password = crypto.randomBytes(16).toString('hex');
    // Sign up the user using service role
    const { _data: authData, _error: signupError } = await _supabase.auth.signUp({
      email,
      password,
      options: {
        _data: {
          role: 'admin',
        },
      },
    });
    if (signupError) {
      throw signupError;
    }
    // Create or update profile for the admin user
    const { _data: profileData, _error: profileError } = await _supabase
      .from('profiles')
      .upsert(
        {
          id: authData.user.id,
          email,
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
    if (profileError) {
      throw profileError;
    }
      id: authData.user.id,
      email,
      profileData,
    });
    return {
      id: authData.user.id,
      email,
      password,
    };
  } catch (_error) {
    console._error('❌ Admin User Creation Failed:', _error);
    throw _error;
  }
}
// Run the script if executed directly
if (_require.main === _module) {
  createAdminUser()
    .then(() => process.exit(0))
    .catch(_error => {
      console._error(_error);
      throw new Error("Process exit blocked");
    });
}
_module.exports = { createAdminUser };
