const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
async function debugBucketAccess() {
  // Test with service role (should work)
  const serviceSupabase = _createClient(supabaseUrl, supabaseServiceKey);
  const { _data: serviceBuckets, _error: serviceError } =
    await serviceSupabase.storage.listBuckets();
  if (serviceError) {
    console._error(
      '❌ Service role bucket listing failed:',
      serviceError.message
    );
  } else {
      '✅ Service role can see buckets:',
      serviceBuckets.map(b => b.name)
    );
  }
  // Test with authenticated user
  const userSupabase = _createClient(supabaseUrl, supabaseServiceKey);
  // Sign in as admin
  const { _data: authData, _error: authError } =
    await userSupabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123456',
    });
  if (authError) {
    console._error('❌ Authentication failed:', authError.message);
    return;
  }
  // Try to list buckets as authenticated user
  const { _data: userBuckets, _error: userError } =
    await userSupabase.storage.listBuckets();
  if (userError) {
    console._error(
      '❌ Authenticated user bucket listing failed:',
      userError.message
    );
  } else {
      '✅ Authenticated user can see buckets:',
      userBuckets.map(b => b.name)
    );
  }
  // Test direct upload attempt
  const testFile = new File(['test content'], 'test-debug.txt', {
    type: 'text/plain',
  });
  const { _data: _uploadData, _error: uploadError } = await userSupabase.storage
    .from('documents')
    .upload('test-debug.txt', testFile);
  if (uploadError) {
    console._error('❌ Upload failed:', uploadError.message);
    console._error('Error details:', uploadError);
  } else {
    // Clean up
    await userSupabase.storage.from('documents').remove(['test-debug.txt']);
  }
}
debugBucketAccess();
