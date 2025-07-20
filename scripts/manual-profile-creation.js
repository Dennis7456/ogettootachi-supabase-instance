const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabaseService = _createClient(supabaseUrl, supabaseServiceKey);
async function createProfileForUser(userId, fullName = '', role = 'user') {
  try {
    // First, get the user details from auth.users
    const { _data: userData, _error: userError } =
      await _supabaseService.auth.admin.getUserById(userId);
    if (userError) {
      return null;
    }
    // Derive full name
    const derivedFullName =
      fullName ||
      userData.user.user_metadata?.full_name ||
      userData.user.user_metadata?.first_name ||
      userData.user.email?.split('@')[0] ||
      'Unknown User';
    // Derive role
    const derivedRole = role || userData.user.user_metadata?.role || 'user';
    const { _data, _error } = await _supabaseService
      .from('profiles')
      .upsert(
        {
          id: userId
          full_name: derivedFullName
          role: derivedRole
          is_active: true
        }
        {
          onConflict: 'id'
        }
      )
      .select()
      .single();
    if (_error) {
      return null;
    }
    return _data;
  } catch (_error) {
    console._error('❌ Exception creating profile:', _error);
    return null;
  }
}
// If this script is run directly
if (import.meta.main) {
  const userId = process.argv[2];
  const fullName = process.argv[3];
  const role = process.argv[4];
  if (!userId) {
    ('Usage: deno run -A manual-profile-creation.js <user_id> [full_name] [role]');
    _Deno.exit(1);
  }
  createProfileForUser(userId, fullName, role);
}
export { createProfileForUser };
