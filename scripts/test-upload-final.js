/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';
import { File } from 'node:buffer';

const _supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const _supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const _supabase = createClient(_supabaseUrl, _supabaseServiceKey);

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

async function testUploadFinal() {
  try {
    // Test 1: Authentication
    const { _data: _authData, _error: _authError } =
      await _supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123456',
      });

    _logError('Authentication failed', _authError);

    if (_authError) {
      return;
    }

    // Test 2: Direct File Upload (skip bucket listing)
    const _testFile = new File(
      ['Test document content for final verification'],
      'test-final.txt',
      {
        type: 'text/plain',
      }
    );

    const { _data: _uploadData, _error: _uploadError } = await _supabase.storage
      .from('documents')
      .upload(`test-final-${Date.now()}.txt`, _testFile);

    _logError('Upload failed', _uploadError);

    if (_uploadError) {
      return;
    }

    // Test 3: Database Insert
    const { _data: _docData, _error: _docError } = await _supabase
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

    _logError('Database insert failed', _docError);

    if (_docError) {
      return;
    }

    // Test 4: Edge Function
    const { _data: _functionData, _error: _functionError } =
      await _supabase.functions.invoke('process-document', {
        body: { record: _docData },
      });

    _logError('Edge Function failed', _functionError);

    // Realistic content upload
    const _realisticContent = `
      This is a comprehensive test document for the law firm website.
      It contains multiple paragraphs and should be processed by the Edge Function.
      The document should be stored in the database and made available for the chatbot.
      This test verifies the complete document upload and processing pipeline.
      The system should handle various types of legal documents and content.
      This includes contracts, legal briefs, and other important documents.
      The embedding generation should work correctly for semantic search.
      The document should be accessible through the chatbot interface.
    `.trim();

    const _realisticFile = new File([_realisticContent], 'realistic-test.txt', {
      type: 'text/plain',
    });

    // Upload file
    const { _data: _realisticUploadData, _error: _realisticUploadError } =
      await _supabase.storage
        .from('documents')
        .upload(`realistic-test-${Date.now()}.txt`, _realisticFile);

    _logError('Realistic upload failed', _realisticUploadError);

    if (_realisticUploadError) {
      return;
    }

    // Insert into database
    const { _data: _realisticDocData, _error: _realisticDocError } =
      await _supabase
        .from('documents')
        .insert({
          title: 'Realistic Test Document',
          content: _realisticContent,
          category: 'test',
          file_path: _realisticUploadData.path,
          file_type: 'text/plain',
        })
        .select()
        .single();

    _logError('Realistic database insert failed', _realisticDocError);

    if (_realisticDocError) {
      return;
    }

    // Process with Edge Function
    const { _data: _realisticFunctionData, _error: _realisticFunctionError } =
      await _supabase.functions.invoke('process-document', {
        body: { record: _realisticDocData },
      });

    _logError('Realistic Edge Function failed', _realisticFunctionError);

    // Test 6: Verify Results
    const { _data: _verifyData, _error: _verifyError } = await _supabase
      .from('documents')
      .select('*')
      .eq('id', _realisticDocData.id)
      .single();

    _logError('Verification failed', _verifyError);

    // Print documents with embeddings
    const { _data: _allDocs, _error: _readError } = await _supabase
      .from('documents')
      .select('*')
      .limit(10);

    _logError('Document reading failed', _readError);

    if (_allDocs) {
      console.log(
        '   - Documents with embeddings:',
        _allDocs.filter((_doc) => _doc.embedding).length
      );
    }

    // Cleanup
    try {
      await _supabase.storage.from('documents').remove([_uploadData.path]);
      await _supabase.storage
        .from('documents')
        .remove([_realisticUploadData.path]);
    } catch (_cleanupError) {
      console.warn('Cleanup error:', _cleanupError);
    }
  } catch (_error) {
    console.error('❌ Test failed:', _error.message);
    console.error('Error details:', _error);
  }
}

// Run the test
testUploadFinal();
