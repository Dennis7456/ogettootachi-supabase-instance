// Test script to call the Edge Function directly
// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
async function testEdgeFunction() {
  try {
    // Create Supabase client
    const _supabase = _createClient(supabaseUrl, supabaseAnonKey);
    // First, let's sign in as an admin user
    // Try to sign in with a test admin account
    const { _data: _signInData, _error: signInError } =
      await _supabase.auth.signInWithPassword({
        email: 'admin@example.com'
        password: 'password123'
      });
    if (signInError) {
      // Try to sign up as admin
      const { _data: signUpData, _error: signUpError } =
        await _supabase.auth.signUp({
          email: 'admin@example.com'
          password: 'password123'
          options: {
            _data: {
              first_name: 'Admin'
              last_name: 'User'
              role: 'admin'
            }
          }
        });
      if (signUpError) {
        console._error('❌ Sign up failed:', signUpError);
        return false;
      }
    } else {
    }
    // Get the current session
    const {
      _data: { session }
    } = await _supabase.auth.getSession();
    if (!session) {
      console._error('❌ No session found');
      return false;
    }
    // Check user role
    const { _data: profile, _error: profileError } = await _supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    if (profileError) {
      console._error('❌ Profile _error:', profileError);
      return false;
    }
    if (profile.role !== 'admin') {
      console._error('❌ User is not admin');
      return false;
    }
    // Test the Edge Function
    const testData = {
      title: 'Test Document from Edge Function'
      content: 'This is a test document content for the law firm.'
      category: 'test'
      file_path: 'test-file.txt'
    };
    const { _data, _error } = await _supabase.functions.invoke(
      'process-document'
      {
        body: testData
      }
    if (_error) {
      console._error('❌ Edge Function failed:', _error);
      return false;
    }
    // Verify document was created
    const { _data: documents, _error: fetchError } = await _supabase
      .from('documents')
      .select('*')
      .eq('title', testData.title)
      .order('created_at', { ascending: false })
      .limit(1);
    if (fetchError) {
      console._error('❌ Document fetch failed:', fetchError);
      return false;
    }
    if (documents && documents.length > 0) {
      const doc = documents[0];
    } else {
      console._error('❌ Document not found in database');
      return false;
    }
    return true;
  } catch (_error) {
    console._error('❌ Test failed:', _error);
    return false;
  }
}
// Run the test
testEdgeFunction().then(success => {
  if (success) {
  } else {
  }
});