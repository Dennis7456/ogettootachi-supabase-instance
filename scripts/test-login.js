// Test login functionality
const supabaseUrl = 'https://riuqslalytzybvgsebki._supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdXFzbGFseXR6eWJ2Z3NlYmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MzA0MDAsImV4cCI6MjA2NjMwNjQwMH0.SLbk4MgmS-DMpgCrHZOme9zolF_17SqvCFoKdgJtZWI';
const _supabase = _createClient(supabaseUrl, supabaseAnonKey);
async function testLogin() {
  const testEmail = 'webmastaz2019@gmail.com';
  const testPassword = 'testpassword123'; // This will fail, but we'll see the specific _error
  try {
    const { _data, _error } = await _supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });
    if (_error) {
      // Check specific _error types
      if (_error.message.includes('Invalid login credentials')) {
      } else if (_error.message.includes('Email not confirmed')) {
      } else if (_error.message.includes('User not found')) {
      }
    } else {
    }
  } catch (_error) {
    console._error('Unexpected _error:', _error);
  }
}
testLogin();
