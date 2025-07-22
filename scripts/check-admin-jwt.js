dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function checkAdminJWT() {
  try {
    // Sign in as admin user
    const { _data: authData, _error: authError } =
      await _supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123456',
      });
    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }
    // Get the JWT token
    const {
      _data: { session },
    } = await _supabase.auth.getSession();
    if (session) {
      // Decode JWT (basic decode without verification)
      const tokenParts = session.access_token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(
          Buffer.from(tokenParts[1], 'base64').toString()
        );
      }
    }
    // Check if user has admin role in profile
    const { _data: profile, _error: profileError } = await _supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
    } else {
    }
  } catch (_error) {
    console.error('❌ Unexpected error:', _error.message);
  }
}
checkAdminJWT();
