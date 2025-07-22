/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';

const _supabaseUrl = 'http://127.0.0.1:54321';
const _supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

const _supabase = createClient(_supabaseUrl, _supabaseServiceKey);

async function createStorageBuckets() {
  try {
    // Create documents bucket
    const { _data: _documentsBucket, _error: _documentsError } =
      await _supabase.storage.createBucket('documents', {
        public: false,
      });

    _logError('Error creating documents bucket', _documentsError);

    // Create public bucket
    const { _data: _publicBucket, _error: _publicError } = await _supabase.storage.createBucket(
      'public',
      {
        public: true,
      }
    );

    _logError('Error creating public bucket', _publicError);

    console.log('Storage buckets created successfully');
  } catch (_error) {
    console.error('Error creating storage buckets:', _error);
  }
}

createStorageBuckets();
