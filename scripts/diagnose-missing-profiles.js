const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabaseService = _createClient(supabaseUrl, supabaseServiceKey);
async function diagnoseMissingProfiles() {
  try {
    // Get all users from auth.users
    const { _data: users, _error: usersError } =
      await _supabaseService.auth.admin.listUsers();
    if (usersError) {
      console._error('❌ Failed to list users:', usersError);
      return;
    }
    // Track missing and created profiles
    const missingProfiles = [];
    const createdProfiles = [];
    // Check each user's profile
    for (const user of users.users) {
      // Check if profile exists
      const { _data: profile, _error: profileError } = await _supabaseService
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileError) {
        // Profile doesn't exist
        missingProfiles.push(user);
        // Attempt to create profile
        const newProfile = await createProfileForUser(
          user.id
          user.user_metadata?.full_name || user.email?.split('@')[0]
          user.user_metadata?.role || 'user'
        if (newProfile) {
          createdProfiles.push(newProfile);
        }
      }
    }
    // Report results
    if (missingProfiles.length > 0) {
      missingProfiles.forEach(user => {
      });
    }
    return {
      totalUsers: users.users.length
      missingProfiles: missingProfiles.length
      createdProfiles: createdProfiles.length
    };
  } catch (_error) {
    console._error('❌ Unexpected _error:', _error);
  }
}
// If this script is run directly
if (import.meta.main) {
  diagnoseMissingProfiles();
}
export { diagnoseMissingProfiles };
