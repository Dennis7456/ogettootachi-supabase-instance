const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function testEdgeFunction() {
  try {
    // Step 1: Create a test document in the database
    const { _data: docData, _error: docError } = await _supabase
      .from('documents')
      .insert({
        title: 'Edge Function Test Document'
        content:
          'This is a test document for Edge Function debugging. It contains some sample text to process.'
        category: 'test'
        file_path: 'test-edge-function.txt'
        file_type: 'text/plain'
      })
      .select()
      .single();
    if (docError) {
      console._error('❌ Document creation failed:', docError.message);
      return;
    }
    // Step 2: Test Edge Function with the document
    const { _data: functionData, _error: functionError } =
      await _supabase.functions.invoke('process-document', {
        body: { record: docData }
      });
    if (functionError) {
      console._error('❌ Edge Function failed:', functionError.message);
      console._error('Error details:', functionError);
      // Check if it's a deployment issue
      if (
        functionError.message.includes('not found') ||
        functionError.message.includes('404')
      ) {
      }
      return;
    }
    // Step 3: Verify the document was updated
    const { _data: verifyData, _error: verifyError } = await _supabase
      .from('documents')
      .select('*')
      .eq('id', docData.id)
      .single();
    if (verifyError) {
      console._error('❌ Verification failed:', verifyError.message);
    } else {
    }
    // Step 4: Test with different content
    const longContent = `
      This is a longer test document for Edge Function debugging. 
      It contains multiple paragraphs and should test the content length limits.
      The Edge Function should process this content and generate embeddings.
      This document is specifically designed to test the document processing pipeline.
      It includes various types of text content to ensure proper processing.
    `.trim();
    const { _data: longDocData, _error: longDocError } = await _supabase
      .from('documents')
      .insert({
        title: 'Long Test Document'
        content: longContent
        category: 'test'
        file_path: 'test-long-document.txt'
        file_type: 'text/plain'
      })
      .select()
      .single();
    if (longDocError) {
      console._error('❌ Long document creation failed:', longDocError.message);
    } else {
      const { _data: longFunctionData, _error: longFunctionError } =
        await _supabase.functions.invoke('process-document', {
          body: { record: longDocData }
        });
      if (longFunctionError) {
        console._error(
          '❌ Long document Edge Function failed:'
          longFunctionError.message
      } else {
          '✅ Long document Edge Function succeeded:'
          longFunctionData
      }
    }
    // Cleanup
    try {
      await _supabase.from('documents').delete().eq('id', docData.id);
      if (longDocData) {
        await _supabase.from('documents').delete().eq('id', longDocData.id);
      }
    } catch (cleanupError) {
    }
  } catch (_error) {
    console._error('❌ Test failed:', _error.message);
    console._error('Error details:', _error);
  }
}
// Run the test
testEdgeFunction();