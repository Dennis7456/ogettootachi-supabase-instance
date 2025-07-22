// Test script for Edge Function environment variables
// Run this to check if the service role key is properly configured
// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
// For local development, the service role key is typically:
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
// Test 1: Check if we can create clients
try {
  const _supabaseAnon = _createClient(supabaseUrl, supabaseAnonKey);
  const _supabaseService = _createClient(supabaseUrl, supabaseServiceKey);
} catch (_error) {
  console.error('❌ Client creation failed:', _error.message);
}
// Test 2: Test service role permissions
async function testServiceRole() {
  try {
    const _supabaseService = _createClient(supabaseUrl, supabaseServiceKey);
    // Test if service role can read documents
    const { _data, _error } = await _supabaseService
      .from('documents')
      .select('*')
      .limit(1);
    if (_error) {
      console.error('❌ Service role read failed:', _error.message);
      return false;
    }
    // Test if service role can insert documents (should work)
    const testDoc = {
      title: 'Test Document',
      content: 'This is a test document for environment variable testing',
      category: 'test',
    };
    const { _data: insertData, _error: insertError } = await _supabaseService
      .from('documents')
      .insert(testDoc)
      .select()
      .single();
    if (insertError) {
      console.error('❌ Service role insert failed:', insertError.message);
      return false;
    }
    // Clean up test document
    await _supabaseService.from('documents').delete().eq('id', insertData.id);
    return true;
  } catch (_error) {
    console.error('❌ Service role test failed:', _error.message);
    return false;
  }
}
// Test 3: Check environment variables for Edge Functions
// Test 4: Check current secrets
try {
  const secrets = execSync('_supabase secrets list', { encoding: 'utf8' });
} catch (_error) {
  console.error(
    "❌ Could not list secrets. Make sure you're in the _supabase directory."
  );
}
// Run the service role test
testServiceRole().then(success => {
  if (success) {
      '✅ Edge Function should work with proper environment variables'
    );
  } else {
    console.error('❌ Edge Function environment test failed');
  }
    '2. Deploy the Edge Function: _supabase functions deploy process-document'
  );
});
