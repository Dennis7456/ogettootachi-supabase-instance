import { createClient } from '@supabase/supabase-js';

// Debug logging function to replace console.log
function debugLog(...args) {
  if (process.env.DEBUG === 'true') {
    const timestamp = new Date().toISOString();
    const logMessage = args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
      .join(' ');
    process.stderr.write(`[DEBUG ${timestamp}] ${logMessage}\n`);
  }
}

// Script to remove the admin user
// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function removeAdminUser() {
  try {
    // Create service role client
    const _supabase = createClient(supabaseUrl, supabaseServiceKey);

    // First, let's find the user
    const { data: users, error: usersError } =
      await _supabase.auth.admin.listUsers();

    if (usersError) {
      debugLog('❌ Failed to list users:', usersError);
      return false;
    }

    // Find the admin user
    const adminUser = users.users.find(
      (user) => user.email === 'admin@example.com'
    );

    if (!adminUser) {
      debugLog('✅ No admin user found');
      return true;
    }

    // Remove the profile first
    const { error: profileError } = await _supabase
      .from('profiles')
      .delete()
      .eq('id', adminUser.id);

    if (profileError) {
      debugLog('❌ Profile removal failed:', profileError);
      return false;
    }

    // Remove the user from auth
    const { error: userError } = await _supabase.auth.admin.deleteUser(
      adminUser.id
    );

    if (userError) {
      debugLog('❌ User removal failed:', userError);
      return false;
    }

    // Verify removal
    const { data: remainingUsers, error: verifyError } =
      await _supabase.auth.admin.listUsers();

    if (verifyError) {
      debugLog('❌ Failed to verify removal:', verifyError);
      return false;
    }

    const remainingAdmin = remainingUsers.users.find(
      (user) => user.email === 'admin@example.com'
    );

    if (remainingAdmin) {
      debugLog('❌ Admin user still exists after removal');
      return false;
    }

    debugLog('✅ Admin user removed successfully');
    return true;
  } catch (error) {
    debugLog('❌ Script failed:', error);
    return false;
  }
}

// Run the script
removeAdminUser().then((success) => {
  debugLog(
    success
      ? '✅ Admin user removal successful'
      : '❌ Admin user removal failed'
  );
});
