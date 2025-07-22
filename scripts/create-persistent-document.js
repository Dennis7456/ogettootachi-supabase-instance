/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';

const _supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const _supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

const _supabase = createClient(_supabaseUrl, _supabaseServiceKey);

async function createPersistentDocument() {
  try {
    // Create a test document that will persist
    const _testDocument = {
      title: 'Dashboard Test Document',
      content: 'This is a persistent test document for the dashboard.',
      category: 'legal',
      file_path: '/documents/dashboard-test.txt',
      file_type: 'text/plain',
    };

    const { _data: _docData, _error: _insertError } = await _supabase
      .from('documents')
      .insert(_testDocument)
      .select()
      .single();

    _logError('Failed to create document', _insertError);

    if (_insertError) {
      return;
    }

    // Process with Edge Function
    const { _data: _edgeData, _error: _edgeError } =
      await _supabase.functions.invoke('process-document', {
        body: { record: _docData },
      });

    _logError('Edge Function failed', _edgeError);

    // Verify final state
    const { _data: _finalDoc, _error: _finalError } = await _supabase
      .from('documents')
      .select('*')
      .eq('id', _docData.id)
      .single();

    _logError('Failed to verify final document', _finalError);

    if (_finalDoc && _finalDoc.embedding) {
      console.log('Persistent document created and processed successfully');
      console.log('Document details:', _finalDoc);
    }
  } catch (_error) {
    console.error('❌ Failed to create persistent document:', _error.message);
    console.error('Error details:', _error);
  }
}

// Run the script
createPersistentDocument();
