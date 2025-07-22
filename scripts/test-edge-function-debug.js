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

async function testEdgeFunctionDebug() {
  try {
    // Create a test document
    const { _data: _docData, _error: _docError } = await _supabase
      .from('documents')
      .insert({
        title: 'Debug Test Document',
        content: 'Test document content for debugging',
        category: 'test',
        file_path: 'debug-test-document.txt',
        file_type: 'text/plain',
      })
      .select()
      .single();
    logError('Document creation failed', _docError);
    if (_docError) return;

    // Test 1: Standard format (what our tests use)
    const { _data: _standardData, _error: _standardError } = await _supabase.functions.invoke(
      'process-document',
      {
        body: { record: _docData },
      }
    );
    logError('Standard format failed', _standardError);

    // Test 2: Direct format
    const { _data: _directData, _error: _directError } = await _supabase.functions.invoke(
      'process-document',
      {
        body: {
          id: _docData.id,
          content: _docData.content,
        },
      }
    );
    logError('Direct format failed', _directError);

    // Test 3: Document format (alternative)
    const { _data: _documentData, _error: _documentError } = await _supabase.functions.invoke(
      'process-document',
      {
        body: { document: _docData },
      }
    );
    logError('Document format failed', _documentError);

    // Test 4: Empty body
    const { _data: _emptyData, _error: _emptyError } = await _supabase.functions.invoke(
      'process-document',
      {
        body: {},
      }
    );
    logError('Empty body failed', _emptyError);

    // Test 5: Invalid JSON
    try {
      const { _data: _invalidData, _error: _invalidError } = await _supabase.functions.invoke(
        'process-document',
        {
          body: 'invalid json',
        }
      );
      logError('Invalid JSON failed', _invalidError);
    } catch (_error) {
      console.error('❌ Invalid JSON threw exception:', _error.message);
    }

    // Test 6: Missing fields
    const { _data: _missingData, _error: _missingError } = await _supabase.functions.invoke(
      'process-document',
      {
        body: {
          id: _docData.id,
          // missing content
        },
      }
    );
    logError('Missing fields failed', _missingError);

    // Prepare debug component call
    const _debugComponentCall = {
      record: {
        id: _docData.id,
        content: _docData.content,
        title: _docData.title,
        category: _docData.category,
        file_path: _docData.file_path,
        file_type: _docData.file_type,
        created_at: _docData.created_at,
        updated_at: _docData.updated_at,
      },
    };

    // Test 7: Debug component simulation
    const { _data: _debugData, _error: _debugError } = await _supabase.functions.invoke(
      'process-document',
      {
        body: _debugComponentCall,
      }
    );
    logError('Debug component simulation failed', _debugError);

    // Cleanup
    try {
      await _supabase.from('documents').delete().eq('id', _docData.id);
    } catch (_cleanupError) {
      // Silently handle cleanup errors
    }
  } catch (_error) {
    console.error('❌ Test failed:', _error.message);
  }
}

// Run the test
testEdgeFunctionDebug();
