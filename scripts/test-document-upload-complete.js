/* eslint-disable no-console, no-undef, no-unused-vars */
import { createClient } from '@supabase/supabase-js';
import { File } from 'node:buffer';

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

async function testDocumentUploadComplete() {
  try {
    // Test 1: Authentication
    const { _data: _authData, _error: _authError } =
      await _supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123456',
      });
    logError('Authentication failed', _authError);
    if (_authError) return;

    // Test 2: Storage Bucket Access
    const { _data: _buckets, _error: _bucketsError } =
      await _supabase.storage.listBuckets();
    logError('Bucket listing failed', _bucketsError);
    if (_bucketsError) return;

    const _documentsBucket = _buckets.find((b) => b.name === 'documents');
    if (!_documentsBucket) {
      console.error('❌ Documents bucket not found');
      return;
    }

    // Test 3: File Upload
    const _testFile = new File(
      ['Test document content for upload verification'],
      'test-document.txt',
      {
        type: 'text/plain',
      }
    );
    const { _data: _uploadData, _error: _uploadError } = await _supabase.storage
      .from('documents')
      .upload(`test-${Date.now()}.txt`, _testFile);
    logError('Upload failed', _uploadError);
    if (_uploadError) return;

    // Test 4: Database Insert
    const { _data: _docData, _error: _docError } = await _supabase
      .from('documents')
      .insert({
        title: 'Test Document',
        content: 'Test document content for upload verification',
        category: 'test',
        file_path: _uploadData.path,
        file_type: 'text/plain',
      })
      .select()
      .single();
    logError('Database insert failed', _docError);
    if (_docError) return;

    // Test 5: Edge Function
    const { _data: _functionData, _error: _functionError } =
      await _supabase.functions.invoke('process-document', {
        body: { record: _docData },
      });
    logError('Edge Function failed', _functionError);

    // Test 6: Full Upload Flow
    // Create a more realistic document
    const _fullContent = `
      This is a comprehensive test document for the law firm website.
      It contains multiple paragraphs and should be processed by the Edge Function.
      The document should be stored in the database and made available for the chatbot.
      This test verifies the complete document upload and processing pipeline.
    `.trim();
    const _fullTestFile = new File([_fullContent], 'comprehensive-test.txt', {
      type: 'text/plain',
    });

    // Upload file
    const { _data: _fullUploadData, _error: _fullUploadError } =
      await _supabase.storage
        .from('documents')
        .upload(`comprehensive-test-${Date.now()}.txt`, _fullTestFile);
    logError('Full upload failed', _fullUploadError);
    if (_fullUploadError) return;

    // Insert into database
    const { _data: _fullDocData, _error: _fullDocError } = await _supabase
      .from('documents')
      .insert({
        title: 'Comprehensive Test Document',
        content: _fullContent,
        category: 'test',
        file_path: _fullUploadData.path,
        file_type: 'text/plain',
      })
      .select()
      .single();
    logError('Full database insert failed', _fullDocError);
    if (_fullDocError) return;

    // Process with Edge Function
    const { _data: _fullFunctionData, _error: _fullFunctionError } =
      await _supabase.functions.invoke('process-document', {
        body: { record: _fullDocData },
      });
    logError('Full Edge Function failed', _fullFunctionError);

    // Test 7: Verify Results
    const { _data: _verifyData, _error: _verifyError } = await _supabase
      .from('documents')
      .select('*')
      .eq('id', _fullDocData.id)
      .single();
    logError('Verification failed', _verifyError);

    // Cleanup
    try {
      await _supabase.storage.from('documents').remove([_uploadData.path]);
      await _supabase.storage.from('documents').remove([_fullUploadData.path]);
    } catch (_cleanupError) {
      // Silently handle cleanup errors
    }
  } catch (_error) {
    console.error('❌ Test suite failed:', _error.message);
  }
}

// Run the test
testDocumentUploadComplete();
