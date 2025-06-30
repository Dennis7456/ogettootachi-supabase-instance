// Script to remove the admin user
import { createClient } from '@supabase/supabase-js';

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

console.log('=== Remove Admin User ===\n');

async function removeAdminUser() {
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
      console.log('✅ No admin user found to remove');
      return true;
    }
    
    console.log('Found admin user:', adminUser.id);
    
    // Remove the profile first
    console.log('Removing admin profile...');
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', adminUser.id);
    
    if (profileError) {
      console.error('❌ Profile removal failed:', profileError);
      return false;
    }
    
    console.log('✅ Admin profile removed');
    
    // Remove the user from auth
    console.log('Removing admin user from auth...');
    const { error: userError } = await supabase.auth.admin.deleteUser(adminUser.id);
    
    if (userError) {
      console.error('❌ User removal failed:', userError);
      return false;
    }
    
    console.log('✅ Admin user removed from auth');
    
    // Verify removal
    const { data: remainingUsers, error: verifyError } = await supabase.auth.admin.listUsers();
    
    if (verifyError) {
      console.error('❌ Failed to verify removal:', verifyError);
      return false;
    }
    
    const remainingAdmin = remainingUsers.users.find(user => user.email === 'admin@example.com');
    
    if (remainingAdmin) {
      console.error('❌ Admin user still exists after removal');
      return false;
    }
    
    console.log('✅ Admin user successfully removed');
    console.log('Remaining users:', remainingUsers.users.length);
    
    return true;
  } catch (error) {
    console.error('❌ Script failed:', error);
    return false;
  }
}

// Run the script
removeAdminUser().then(success => {
  if (success) {
    console.log('\n🎉 Admin user removed successfully!');
  } else {
    console.log('\n❌ Failed to remove admin user');
  }
}); 