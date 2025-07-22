const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function testUploadDirect() {
  try {
    // Step 1: Authenticate as admin
    const { _data: authData, _error: authError } =
      await _supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123456',
      });
    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }
    // Step 2: Test direct upload (skip bucket listing)
    const testFile = new File(
      ['Test document content for direct upload'],
      'test-direct.txt',
      {
        type: 'text/plain',
      }
    );
    const { _data: _uploadData, _error: uploadError } = await _supabase.storage
      .from('documents')
      .upload(`test-direct-${Date.now()}.txt`, testFile);
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      console.error('Error details:', uploadError);
      return;
    }
    // Step 3: Test database insert
    const { _data: docData, _error: docError } = await _supabase
      .from('documents')
      .insert({
        title: 'Direct Test Document',
        content: 'Test document content for direct upload',
        category: 'test',
        file_path: _uploadData.path,
        file_type: 'text/plain',
      })
      .select()
      .single();
    if (docError) {
      console.error('❌ Database insert failed:', docError.message);
      return;
    }
    // Step 4: Test Edge Function
    const { _data: functionData, _error: functionError } =
      await _supabase.functions.invoke('process-document', {
        body: { record: docData },
      });
    if (functionError) {
      console.error('❌ Edge Function failed:', functionError.message);
      console.error('Error details:', functionError);
    } else {
    }
    // Step 5: Verify the document
    const { _data: verifyData, _error: verifyError } = await _supabase
      .from('documents')
      .select('*')
      .eq('id', docData.id)
      .single();
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
    }
    // Step 6: Test reading documents
    const { _data: allDocs, _error: readError } = await _supabase
      .from('documents')
      .select('*')
      .limit(5);
    if (readError) {
      console.error('❌ Document reading failed:', readError.message);
    } else {
    }
    // Cleanup
    try {
      await _supabase.storage.from('documents').remove([_uploadData.path]);
    } catch (cleanupError) {}
  } catch (_error) {
    console.error('❌ Test failed:', _error.message);
    console.error('Error details:', _error);
  }
}
// Run the test
testUploadDirect();
