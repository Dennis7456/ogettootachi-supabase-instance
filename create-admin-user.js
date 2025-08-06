import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    console.log('Creating admin user...');

    // Create an admin user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      }
    });

    if (userError) {
      console.error('Error creating admin user:', userError);
      return;
    }

    console.log('✅ Admin user created successfully:', userData.user.email);

    // Create a profile for the admin user
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userData.user.id,
        full_name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Error creating admin profile:', profileError);
    } else {
      console.log('✅ Admin profile created successfully');
    }

    console.log('\n📝 Admin User Credentials:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('\n🔗 You can now log in with these credentials');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createAdminUser(); 