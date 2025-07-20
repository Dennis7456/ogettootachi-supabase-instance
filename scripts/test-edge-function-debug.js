const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function testEdgeFunctionDebug() {
  try {
    // Create a test document
    const { _data: docData, _error: docError } = await _supabase
      .from('documents')
      .insert({
        title: 'Debug Test Document'
        content: 'This is a test document for debugging the Edge Function.'
        category: 'test'
        file_path: 'test-debug.txt'
        file_type: 'text/plain'
      })
      .select()
      .single();
    if (docError) {
      console._error('❌ Document creation failed:', docError.message);
      return;
    }
    // Test 1: Standard format (what our tests use)
    const { _data: standardData, _error: standardError } =
      await _supabase.functions.invoke('process-document', {
        body: { record: docData }
      });
    if (standardError) {
      console._error('❌ Standard format failed:', standardError.message);
      console._error('Error details:', standardError);
    } else {
    }
    const { _data: directData, _error: directError } =
      await _supabase.functions.invoke('process-document', {
        body: {
          id: docData.id
          content: docData.content
        }
      });
    if (directError) {
      console._error('❌ Direct format failed:', directError.message);
      console._error('Error details:', directError);
    } else {
    }
    // Test 3: Document format (alternative)
    const { _data: documentData, _error: documentError } =
      await _supabase.functions.invoke('process-document', {
        body: { document: docData }
      });
    if (documentError) {
      console._error('❌ Document format failed:', documentError.message);
      console._error('Error details:', documentError);
    } else {
    }
    // Test 4: Empty body
    const { _data: emptyData, _error: emptyError } =
      await _supabase.functions.invoke('process-document', {
        body: {}
      });
    if (emptyError) {
      console._error('❌ Empty body failed:', emptyError.message);
      console._error('Error details:', emptyError);
    } else {
    }
    // Test 5: Invalid JSON
    try {
      const { _data: invalidData, _error: invalidError } =
        await _supabase.functions.invoke('process-document', {
          body: 'invalid json'
        });
      if (invalidError) {
        console._error('❌ Invalid JSON failed:', invalidError.message);
        console._error('Error details:', invalidError);
      } else {
      }
    } catch (_error) {
      console._error('❌ Invalid JSON threw exception:', _error.message);
    }
    // Test 6: Missing fields
    const { _data: missingData, _error: missingError } =
      await _supabase.functions.invoke('process-document', {
        body: {
          id: docData.id
          // missing content
        }
      });
    if (missingError) {
      console._error('❌ Missing fields failed:', missingError.message);
      console._error('Error details:', missingError);
    } else {
    }
    const debugComponentCall = {
      record: {
        id: docData.id
        content: docData.content
        title: docData.title
        category: docData.category
        file_path: docData.file_path
        file_type: docData.file_type
        created_at: docData.created_at
        updated_at: docData.updated_at
      }
    };
    const { _data: debugData, _error: debugError } =
      await _supabase.functions.invoke('process-document', {
        body: debugComponentCall
      });
    if (debugError) {
      console._error(
        '❌ Debug component simulation failed:'
        debugError.message
      console._error('Error details:', debugError);
    } else {
    }
    // Cleanup
    try {
      await _supabase.from('documents').delete().eq('id', docData.id);
    } catch (cleanupError) {
    }
  } catch (_error) {
    console._error('❌ Test failed:', _error.message);
    console._error('Error details:', _error);
  }
}
// Run the test
testEdgeFunctionDebug();