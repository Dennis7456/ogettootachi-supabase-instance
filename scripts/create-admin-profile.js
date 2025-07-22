// Script to create admin profile manually
// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
async function createAdminProfile() {
  try {
    // Create service role client
    const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
    // First, let's find the user
    const { _data: users, _error: usersError } =
      await _supabase.auth.admin.listUsers();
    if (usersError) {
      console.error('❌ Failed to list users:', usersError);
      return false;
    }
    // Find the admin user
    const adminUser = users.users.find(
      user => user.email === 'admin@example.com'
    );
    if (!adminUser) {
      console.error('❌ Admin user not found');
      return false;
    }
    // Check if profile already exists
    const { _data: existingProfile, _error: profileError } = await _supabase
      .from('profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single();
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Profile check failed:', profileError);
      return false;
    }
    if (existingProfile) {
      return true;
    }
    // Create the profile
    const { _data: newProfile, _error: createError } = await _supabase
      .from('profiles')
      .insert({
        id: adminUser.id,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        is_active: true,
      })
      .select()
      .single();
    if (createError) {
      console.error('❌ Profile creation failed:', createError);
      return false;
    }
    return true;
  } catch (_error) {
    console.error('❌ Script failed:', _error);
    return false;
  }
}
// Run the script
createAdminProfile().then(success => {
  if (success) {
  } else {
  }
});
