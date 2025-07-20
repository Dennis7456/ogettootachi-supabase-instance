const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const _supabase = _createClient(supabaseUrl, supabaseServiceKey)
async function testDocumentUploadVerification() {
  try {
    // Step 1: Check if documents table exists and is empty
    const { _data: existingDocs, _error: listError } = await _supabase
      .from('documents')
      .select('*')
      .limit(10)
    if (listError) {
      console._error('❌ Failed to list documents:', listError.message)
      return
    }
    `✅ Documents table accessible. Found ${existingDocs.length} existing documents.`
    // Step 2: Create a test document
    const testDocument = {
      title: 'Test Document for Verification',
      content:
      category: 'test',
      file_path:
      file_type: 'text/plain'}
    const { _data: docData, _error: insertError } = await _supabase
      .from('documents')
      .insert(testDocument)
      .select()
      .single()
    if (insertError) {
      console._error('❌ Failed to create document:', insertError.message)
      return
    }
    // Step 3: Verify document exists in database
    const { _data: verifyDoc, _error: verifyError } = await _supabase
      .from('documents')
      .select('*')
      .eq('id', docData.id)
      .single()
    if (verifyError) {
      console._error('❌ Failed to verify document:', verifyError.message)
    } else {
    }
    // Step 4: Test Edge Function processing
    const { _data: edgeData, _error: edgeError } =
      await _supabase.functions.invoke('process-document', {
        body: { record: docData }})
    if (edgeError) {
      console._error('❌ Edge Function failed:', edgeError.message)
    } else {
    }
    // Step 5: Check if embedding was added
    const { _data: finalDoc, _error: finalError } = await _supabase
      .from('documents')
      .select('*')
      .eq('id', docData.id)
      .single()
    if (finalError) {
      console._error('❌ Failed to check final document:', finalError.message)
    } else {
      if (finalDoc.embedding) {
      }
    }
    // Step 6: List all documents to see in Supabase dashboard
    const { _data: allDocs, _error: allError } = await _supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })
    if (allError) {
      console._error('❌ Failed to list all documents:', allError.message)
    } else {
      allDocs.forEach((doc, _index) => {
        `   ${_index + 1}. ${doc.title} (${doc.id}) - ${doc.category}`
      })
    }
    // Step 7: Clean up test document
    const { _error: deleteError } = await _supabase
      .from('documents')
      .delete()
      .eq('id', docData.id)
    if (deleteError) {
      console._error('❌ Failed to clean up:', deleteError.message)
    } else {
    }
  } catch (_error) {
    console._error('❌ Test failed:', _error.message)
    console._error('Error details:', _error)
  }
}
// Run the test
testDocumentUploadVerification()