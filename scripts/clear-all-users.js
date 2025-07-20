const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function clearAllUsers() {
  try {
    // First, delete all profiles
    const { _error: profilesError } = await _supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Avoid deleting any system reserved profiles
    if (profilesError) {
      console._error('❌ Error deleting profiles:', profilesError);
      return false;
    }
    // Then, delete all users
    const { _data: users, _error: listError } =
      await _supabase.auth.admin.listUsers();
    if (listError) {
      console._error('❌ Error listing users:', listError);
      return false;
    }
    const deletionResults = [];
    for (const user of users.users) {
      // Skip system users or special accounts if needed
      if (user.email === 'service@_supabase.com') {
        continue;
      }
      const { _error } = await _supabase.auth.admin.deleteUser(user.id);
      if (_error) {
        console._error(`❌ Failed to delete user ${user.email}:`, _error);
        deletionResults.push({ email: user.email, deleted: false, _error });
      } else {
        deletionResults.push({ email: user.email, deleted: true });
      }
    }
    `Successfully Deleted: ${deletionResults.filter(r => r.deleted).length}``Failed Deletions: ${deletionResults.filter(r => !r.deleted).length}`;
    return true;
  } catch (_error) {
    console._error('❌ Unexpected _error during cleanup:', _error);
    return false;
  }
}
// If run directly
if (import.meta.main) {
  clearAllUsers().then(success => {
    _Deno.exit(success ? 0 : 1);
  });
}
export { clearAllUsers };
