// Script to create admin profile manually
import { createClient } from '@supabase/supabase-js';

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

console.log('=== Create Admin Profile ===\n');

async function createAdminProfile() {
  try {
    // Create service role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // First, let's find the user
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Failed to list users:', usersError);
      return false;
    }
    
    console.log('Found users:', users.users.length);
    
    // Find the admin user
    const adminUser = users.users.find(user => user.email === 'admin@example.com');
    
    if (!adminUser) {
      console.error('❌ Admin user not found');
      return false;
    }
    
    console.log('✅ Found admin user:', adminUser.id);
    
    // Check if profile already exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Profile check failed:', profileError);
      return false;
    }
    
    if (existingProfile) {
      console.log('✅ Profile already exists:', existingProfile);
      return true;
    }
    
    // Create the profile
    console.log('Creating admin profile...');
    
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: adminUser.id,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        is_active: true
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Profile creation failed:', createError);
      return false;
    }
    
    console.log('✅ Admin profile created:', newProfile);
    return true;
  } catch (error) {
    console.error('❌ Script failed:', error);
    return false;
  }
}

// Run the script
createAdminProfile().then(success => {
  if (success) {
    console.log('\n🎉 Admin profile created successfully!');
    console.log('You can now test the Edge Function.');
  } else {
    console.log('\n❌ Failed to create admin profile');
  }
}); 