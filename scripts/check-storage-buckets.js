/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';

// Script to check and create storage buckets
// Local Supabase configuration
const _supabaseUrl = 'http://127.0.0.1:54321';
const _supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

async function checkAndCreateBuckets() {
  try {
    // Create service role client
    const _supabase = createClient(_supabaseUrl, _supabaseServiceKey);

    // List existing buckets
    const { _data: _buckets, _error: _bucketsError } = await _supabase.storage.listBuckets();

    _logError('Failed to list buckets', _bucketsError);

    if (_bucketsError) {
      return false;
    }

    console.log(
      'Found buckets:',
      _buckets.map((_b) => _b.name)
    );

    // Check if documents bucket exists
    const _documentsBucket = _buckets.find((_bucket) => _bucket.name === 'documents');
    if (!_documentsBucket) {
      const { _data: _newBucket, _error: _createError } = await _supabase.storage.createBucket(
        'documents',
        {
          public: false,
          allowedMimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
          ],
          fileSizeLimit: 10485760, // 10MB
        }
      );

      _logError('Failed to create documents bucket', _createError);

      if (_createError) {
        return false;
      }
    }

    // Check if public bucket exists
    const _publicBucket = _buckets.find((_bucket) => _bucket.name === 'public');
    if (!_publicBucket) {
      const { _data: _newPublicBucket, _error: _createPublicError } =
        await _supabase.storage.createBucket('public', {
          public: true,
        });

      _logError('Failed to create public bucket', _createPublicError);

      if (_createPublicError) {
        return false;
      }
    }

    // List buckets again to confirm
    const { _data: _finalBuckets } = await _supabase.storage.listBuckets();

    console.log(
      'Available buckets:',
      _finalBuckets.map((_b) => _b.name)
    );

    return true;
  } catch (_error) {
    console.error('❌ Script failed:', _error);
    return false;
  }
}

// Run the script
checkAndCreateBuckets().then((_success) => {
  if (_success) {
    console.log('✅ Storage bucket check completed successfully');
  } else {
    console.error('❌ Storage bucket check failed');
  }
});
