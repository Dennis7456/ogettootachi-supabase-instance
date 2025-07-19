const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

async function createAdminUser() {
  // Supabase local development configuration
  const supabaseUrl = 'http://127.0.0.1:54321';
  const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9.vI9P_lz1zx-h4Zt2_NQtMvDN8WmVX3cq4WzQzLMqMAA';

  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  try {
    // Generate a unique email
    const email = `admin-${crypto.randomBytes(4).toString('hex')}@ogetto-otachi.com`;
    const password = crypto.randomBytes(16).toString('hex');

    // Sign up the user using service role
    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'admin'
        }
      }
    });

    if (signupError) {
      throw signupError;
    }

    // Create or update profile for the admin user
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: email,
        role: 'admin',
        full_name: 'Admin User',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      throw profileError;
    }

    console.log('✅ Admin User Created:', {
      id: authData.user.id,
      email: email,
      profileData: profileData
    });

    return {
      id: authData.user.id,
      email: email,
      password: password
    };
  } catch (error) {
    console.error('❌ Admin User Creation Failed:', error);
    throw error;
  }
}

// Run the script if executed directly
if (require.main === module) {
  createAdminUser()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { createAdminUser }; 