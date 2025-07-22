/* eslint-disable no-console, no-undef, no-unused-vars */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = createClient(supabaseUrl, supabaseServiceKey);

// Utility function for logging errors
const logError = (prefix, error) => {
  if (error) {
    console.error(`❌ ${prefix}:`, error.message);
  }
};

async function testDocumentUploadVerification() {
  try {
    // Step 1: Check if documents table exists and is empty
    const { _data: _existingDocs, _error: _listError } = await _supabase
      .from('documents')
      .select('*')
      .limit(10);
    logError('Failed to list documents', _listError);
    if (_listError) return;

    // Log existing documents count
    console.log(`✅ Documents table accessible. Found ${_existingDocs.length} existing documents.`);

    // Step 2: Create a test document
    const _testDocument = {
      title: 'Test Document for Verification',
      content: 'This is a test document for upload verification',
      category: 'test',
      file_path: 'test-verification-document.txt',
      file_type: 'text/plain',
    };
    const { _data: _docData, _error: _insertError } = await _supabase
      .from('documents')
      .insert(_testDocument)
      .select()
      .single();
    logError('Failed to create document', _insertError);
    if (_insertError) return;

    // Step 3: Verify document exists in database
    const { _data: _verifyDoc, _error: _verifyError } = await _supabase
      .from('documents')
      .select('*')
      .eq('id', _docData.id)
      .single();
    logError('Failed to verify document', _verifyError);

    // Step 4: Test Edge Function processing
    const { _data: _edgeData, _error: _edgeError } = await _supabase.functions.invoke(
      'process-document',
      {
        body: { record: _docData },
      }
    );
    logError('Edge Function failed', _edgeError);

    // Step 5: Check if embedding was added
    const { _data: _finalDoc, _error: _finalError } = await _supabase
      .from('documents')
      .select('*')
      .eq('id', _docData.id)
      .single();
    logError('Failed to check final document', _finalError);

    if (_finalDoc && !_finalDoc.embedding) {
      console.warn('⚠️ No embedding generated');
    }

    // Step 6: List all documents to see in Supabase dashboard
    const { _data: _allDocs, _error: _allError } = await _supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    logError('Failed to list all documents', _allError);

    // Step 7: Clean up test document
    const { _error: _deleteError } = await _supabase
      .from('documents')
      .delete()
      .eq('id', _docData.id);
    logError('Failed to clean up', _deleteError);
  } catch (_error) {
    console.error('❌ Test failed:', _error.message);
  }
}

// Run the test
testDocumentUploadVerification();
