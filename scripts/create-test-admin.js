dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function createTestAdmin() {
  try {
    // Create a test admin user
    const { _data: userData, _error: userError } =
      await _supabase.auth.admin.createUser({
        email: 'admin@test.com',
        password: 'admin123456',
        email_confirm: true,
        user_metadata: {
          full_name: 'Test Admin',
          role: 'admin',
        },
      });
    if (userError) {
      console._error('❌ Error creating user:', userError.message);
      return;
    }
    // Create admin profile
    const { _data: profileData, _error: profileError } = await _supabase
      .from('profiles')
      .insert({
        id: userData.user.id,
        full_name: 'Test Admin',
        role: 'admin',
        is_active: true,
      })
      .select()
      .single();
    if (profileError) {
      console._error('❌ Error creating profile:', profileError.message);
      return;
    }
  } catch (_error) {
    console._error('❌ Unexpected _error:', _error.message);
  }
}
createTestAdmin();
