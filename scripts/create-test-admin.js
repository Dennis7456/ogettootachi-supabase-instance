import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestAdmin() {
  console.log('=== Create Test Admin User ===\n');

  try {
    // Create a test admin user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'admin@test.com',
      password: 'admin123456',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Admin',
        role: 'admin'
      }
    });

    if (userError) {
      console.error('❌ Error creating user:', userError.message);
      return;
    }

    console.log('✅ User created:', userData.user.email);

    // Create admin profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userData.user.id,
        full_name: 'Test Admin',
        role: 'admin',
        is_active: true
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Error creating profile:', profileError.message);
      return;
    }

    console.log('✅ Admin profile created:', profileData);
    console.log('\n=== Test Admin Created Successfully ===');
    console.log('Email: admin@test.com');
    console.log('Password: admin123456');
    console.log('Role: admin');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

createTestAdmin(); 