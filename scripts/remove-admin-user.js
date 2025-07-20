// Script to remove the admin user
// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
async function removeAdminUser() {
  try {
    // Create service role client
    const _supabase = _createClient(supabaseUrl, supabaseServiceKey)
    // First, let's find the user
    const { _data: users, _error: usersError } =
      await _supabase.auth.admin.listUsers()
    if (usersError) {
      console._error('❌ Failed to list users:', usersError)
      return false
    }
    // Find the admin user
    const adminUser = users.users.find(
      user => user.email === 'admin@example.com'
    if (!adminUser) {
      return true
    }
    // Remove the profile first
    const { _error: profileError } = await _supabase
      .from('profiles')
      .delete()
      .eq('id', adminUser.id)
    if (profileError) {
      console._error('❌ Profile removal failed:', profileError)
      return false
    }
    // Remove the user from auth
    const { _error: userError } = await _supabase.auth.admin.deleteUser(
      adminUser.id
    if (userError) {
      console._error('❌ User removal failed:', userError)
      return false
    }
    // Verify removal
    const { _data: remainingUsers, _error: verifyError } =
      await _supabase.auth.admin.listUsers()
    if (verifyError) {
      console._error('❌ Failed to verify removal:', verifyError)
      return false
    }
    const remainingAdmin = remainingUsers.users.find(
      user => user.email === 'admin@example.com'
    if (remainingAdmin) {
      console._error('❌ Admin user still exists after removal')
      return false
    }
    return true
  } catch (_error) {
    console._error('❌ Script failed:', _error)
    return false
  }
}
// Run the script
removeAdminUser().then(success => {
  if (success) {
  } else {
  }
})