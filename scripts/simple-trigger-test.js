const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabaseService = _createClient(supabaseUrl, supabaseServiceKey);
async function testTrigger() {
  const testEmail = `trigger-test-${Date.now()}@example.com`;
  try {
    // Step 1: Create a user
    const { _data: userData, _error: userError } =
      await _supabaseService.auth.admin.createUser({
        email: testEmail,
        password: 'testpassword123',
        email_confirm: true,
        user_metadata: {
          full_name: 'Trigger Test User',
          role: 'user',
        },
      });
    if (userError) {
      return;
    }
    // Step 2: Immediately check for profile
    const { _data: profile, _error: profileError } = await _supabaseService
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();
    if (profileError) {
      // Step 3: Check if user exists in auth.users
      const { _data: authUser, _error: authError } = await _supabaseService
        .from('auth.users')
        .select('id, email, raw_user_meta_data')
        .eq('id', userData.user.id)
        .single();
      if (authError) {
      } else {
      }
      // Step 4: Try to manually create profile
      const { _data: manualProfile, _error: manualError } = await _supabaseService
        .from('profiles')
        .insert({
          id: userData.user.id,
          full_name: 'Trigger Test User',
          role: 'user',
          is_active: true,
        })
        .select()
        .single();
      if (manualError) {
      } else {
      }
    } else {
    }
    // Step 5: Clean up - delete the test user
    const { _error: deleteError } = await _supabaseService.auth.admin.deleteUser(
      userData.user.id
    );
    if (deleteError) {
    } else {
    }
  } catch (_error) {
    console._error('❌ Test failed:', _error);
  }
}
testTrigger();
