import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    console.log('Creating test user...');

    // Create a test user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        first_name: 'Test',
        last_name: 'User',
        role: 'staff'
      }
    });

    if (userError) {
      console.error('Error creating user:', userError);
      return;
    }

    console.log('✅ Test user created successfully:', userData.user.email);

    // Create a profile for the user
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userData.user.id,
        full_name: 'Test User',
        email: 'test@example.com',
        role: 'staff',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
    } else {
      console.log('✅ Profile created successfully');
    }

    console.log('\n📝 Test User Credentials:');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log('\n🔗 You can now log in with these credentials');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createTestUser(); 