const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function testUploadFinal() {
  try {
    // Test 1: Authentication
    const { _data: authData, _error: authError } =
      await _supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123456',
      });
    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }
    // Test 2: Direct File Upload (skip bucket listing)
    const testFile = new File(
      ['Test document content for final verification'],
      'test-final.txt',
      {
        type: 'text/plain',
      }
    );
    const { _data: _uploadData, _error: uploadError } = await _supabase.storage
      .from('documents')
      .upload(`test-final-${Date.now()}.txt`, testFile);
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      console.error('Error details:', uploadError);
      return;
    }
    // Test 3: Database Insert
    const { _data: docData, _error: docError } = await _supabase
      .from('documents')
      .insert({
        title: 'Final Test Document',
        content: 'Test document content for final verification',
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
    // Test 4: Edge Function
    const { _data: functionData, _error: functionError } =
      await _supabase.functions.invoke('process-document', {
        body: { record: docData },
      });
    if (functionError) {
      console.error('❌ Edge Function failed:', functionError.message);
      console.error('Error details:', functionError);
    } else {
    }
    // Realistic content upload
    const realisticContent = `
      This is a comprehensive test document for the law firm website.
      It contains multiple paragraphs and should be processed by the Edge Function.
      The document should be stored in the database and made available for the chatbot.
      This test verifies the complete document upload and processing pipeline.
      The system should handle various types of legal documents and content.
      This includes contracts, legal briefs, and other important documents.
      The embedding generation should work correctly for semantic search.
      The document should be accessible through the chatbot interface.
    `.trim();
    const realisticFile = new File([realisticContent], 'realistic-test.txt', {
      type: 'text/plain',
    });
    // Upload file
    const { _data: realisticUploadData, _error: realisticUploadError } =
      await _supabase.storage
        .from('documents')
        .upload(`realistic-test-${Date.now()}.txt`, realisticFile);
    if (realisticUploadError) {
      console.error(
        '❌ Realistic upload failed:',
        realisticUploadError.message
      );
      return;
    }
    // Insert into database
    const { _data: realisticDocData, _error: realisticDocError } =
      await _supabase
        .from('documents')
        .insert({
          title: 'Realistic Test Document',
          content: realisticContent,
          category: 'test',
          file_path: realisticUploadData.path,
          file_type: 'text/plain',
        })
        .select()
        .single();
    if (realisticDocError) {
      console.error(
        '❌ Realistic database insert failed:',
        realisticDocError.message
      );
      return;
    }
    // Process with Edge Function
    const { _data: realisticFunctionData, _error: realisticFunctionError } =
      await _supabase.functions.invoke('process-document', {
        body: { record: realisticDocData },
      });
    if (realisticFunctionError) {
      console.error(
        '❌ Realistic Edge Function failed:',
        realisticFunctionError.message
      );
    } else {
    }
    // Test 6: Verify Results
    const { _data: verifyData, _error: verifyError } = await _supabase
      .from('documents')
      .select('*')
      .eq('id', realisticDocData.id)
      .single();
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
    }
    // Print documents with embeddings
    const { _data: allDocs, _error: readError } = await _supabase
      .from('documents')
      .select('*')
      .limit(10);
    if (readError) {
      console.error('❌ Document reading failed:', readError.message);
    } else {
        '   - Documents with embeddings:',
        allDocs.filter(doc => doc.embedding).length
      );
    }
    // Cleanup
    try {
      await _supabase.storage.from('documents').remove([_uploadData.path]);
      await _supabase.storage
        .from('documents')
        .remove([realisticUploadData.path]);
    } catch (cleanupError) {}
  } catch (_error) {
    console.error('❌ Test failed:', _error.message);
    console.error('Error details:', _error);
  }
}
// Run the test
testUploadFinal();
