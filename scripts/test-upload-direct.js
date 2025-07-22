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

async function testUploadDirect() {
  try {
    // Step 1: Authenticate as admin
    const { _data: _authData, _error: _authError } = await _supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123456',
    });
    logError('Authentication failed', _authError);
    if (_authError) return;

    // Step 2: Test direct upload (skip bucket listing)
    const _testFile = new File(['Test document content for direct upload'], 'test-direct.txt', {
      type: 'text/plain',
    });
    const { _data: _uploadData, _error: _uploadError } = await _supabase.storage
      .from('documents')
      .upload(`test-direct-${Date.now()}.txt`, _testFile);
    logError('Upload failed', _uploadError);
    if (_uploadError) return;

    // Step 3: Test database insert
    const { _data: _docData, _error: _docError } = await _supabase
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
    logError('Database insert failed', _docError);
    if (_docError) return;

    // Step 4: Test Edge Function
    const { _data: _functionData, _error: _functionError } = await _supabase.functions.invoke(
      'process-document',
      {
        body: { record: _docData },
      }
    );
    logError('Edge Function failed', _functionError);

    // Step 5: Verify the document
    const { _data: _verifyData, _error: _verifyError } = await _supabase
      .from('documents')
      .select('*')
      .eq('id', _docData.id)
      .single();
    logError('Verification failed', _verifyError);

    // Step 6: Test reading documents
    const { _data: _allDocs, _error: _readError } = await _supabase
      .from('documents')
      .select('*')
      .limit(5);
    logError('Document reading failed', _readError);

    // Cleanup
    try {
      await _supabase.storage.from('documents').remove([_uploadData.path]);
    } catch (_cleanupError) {
      // Silently handle cleanup errors
    }
  } catch (_error) {
    console.error('❌ Test failed:', _error.message);
  }
}

// Run the test
testUploadDirect();
