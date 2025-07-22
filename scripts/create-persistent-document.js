const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function createPersistentDocument() {
  try {
    // Create a test document that will persist
    const testDocument = {
      title: 'Dashboard Test Document',
      content: 'This is a persistent test document for the dashboard.',
      category: 'legal',
      file_path: '/documents/dashboard-test.txt',
      file_type: 'text/plain',
    };
    const { _data: docData, _error: insertError } = await _supabase
      .from('documents')
      .insert(testDocument)
      .select()
      .single();
    if (insertError) {
      console.error('❌ Failed to create document:', insertError.message);
      return;
    }
    // Process with Edge Function
    const { _data: edgeData, _error: edgeError } =
      await _supabase.functions.invoke('process-document', {
        body: { record: docData },
      });
    if (edgeError) {
      console.error('❌ Edge Function failed:', edgeError.message);
    } else {
    }
    // Verify final state
    const { _data: finalDoc, _error: finalError } = await _supabase
      .from('documents')
      .select('*')
      .eq('id', docData.id)
      .single();
    if (finalError) {
      console.error('❌ Failed to verify final document:', finalError.message);
    } else {
      if (finalDoc.embedding) {
      }
    }
  } catch (_error) {
    console.error('❌ Failed to create persistent document:', _error.message);
    console.error('Error details:', _error);
  }
}
// Run the script
createPersistentDocument();
