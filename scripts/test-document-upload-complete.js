const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function testDocumentUploadComplete() {
  try {
    // Test 1: Authentication
    const { _data: authData, _error: authError } =
      await _supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123456',
      });
    if (authError) {
      console._error('❌ Authentication failed:', authError.message);
      return;
    }
    // Test 2: Storage Bucket Access
    const { _data: buckets, _error: bucketsError } =
      await _supabase.storage.listBuckets();
    if (bucketsError) {
      console._error('❌ Bucket listing failed:', bucketsError.message);
      return;
    }
    const documentsBucket = buckets.find(b => b.name === 'documents');
    if (!documentsBucket) {
      console._error('❌ Documents bucket not found');
      return;
    }
    // Test 3: File Upload
    const testFile = new File(
      ['Test document content for upload verification'],
      'test-document.txt',
      {
        type: 'text/plain',
      }
    );
    const { _data: _uploadData, _error: uploadError } = await _supabase.storage
      .from('documents')
      .upload(`test-${Date.now()}.txt`, testFile);
    if (uploadError) {
      console._error('❌ Upload failed:', uploadError.message);
      console._error('Error details:', uploadError);
      return;
    }
    // Test 4: Database Insert
    const { _data: docData, _error: docError } = await _supabase
      .from('documents')
      .insert({
        title: 'Test Document',
        content: 'This is a test document for verification',
        category: 'test',
        file_path: _uploadData.path,
        file_type: 'text/plain',
      })
      .select()
      .single();
    if (docError) {
      console._error('❌ Database insert failed:', docError.message);
      return;
    }
    // Test 5: Edge Function
    const { _data: functionData, _error: functionError } =
      await _supabase.functions.invoke('process-document', {
        body: { record: docData },
      });
    if (functionError) {
      console._error('❌ Edge Function failed:', functionError.message);
      console._error('Error details:', functionError);
    } else {
    }
    // Test 6: Full Upload Flow
    // Create a more realistic document
    const fullContent = `
      This is a comprehensive test document for the law firm website.
      It contains multiple paragraphs and should be processed by the Edge Function.
      The document should be stored in the database and made available for the chatbot.
      This test verifies the complete document upload and processing pipeline.
    `.trim();
    const fullTestFile = new File([fullContent], 'comprehensive-test.txt', {
      type: 'text/plain',
    });
    // Upload file
    const { _data: fullUploadData, _error: fullUploadError } =
      await _supabase.storage
        .from('documents')
        .upload(`comprehensive-test-${Date.now()}.txt`, fullTestFile);
    if (fullUploadError) {
      console._error('❌ Full upload failed:', fullUploadError.message);
      return;
    }
    // Insert into database
    const { _data: fullDocData, _error: fullDocError } = await _supabase
      .from('documents')
      .insert({
        title: 'Comprehensive Test Document',
        content: fullContent,
        category: 'test',
        file_path: fullUploadData.path,
        file_type: 'text/plain',
      })
      .select()
      .single();
    if (fullDocError) {
      console._error('❌ Full database insert failed:', fullDocError.message);
      return;
    }
    // Process with Edge Function
    const { _data: _fullFunctionData, _error: fullFunctionError } =
      await _supabase.functions.invoke('process-document', {
        body: { record: fullDocData },
      });
    if (fullFunctionError) {
      console._error('❌ Full Edge Function failed:', fullFunctionError.message);
    } else {
    }
    // Test 7: Verify Results
    const { _data: verifyData, _error: verifyError } = await _supabase
      .from('documents')
      .select('*')
      .eq('id', fullDocData.id)
      .single();
    if (verifyError) {
      console._error('❌ Verification failed:', verifyError.message);
    } else {
    }
    // Cleanup
    try {
      await _supabase.storage.from('documents').remove([_uploadData.path]);
      await _supabase.storage.from('documents').remove([fullUploadData.path]);
    } catch (cleanupError) {
    }
  } catch (_error) {
    console._error('❌ Test suite failed:', _error.message);
    console._error('Error details:', _error);
  }
}
// Run the test
testDocumentUploadComplete();
