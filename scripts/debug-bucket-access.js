/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';
import { File } from 'node:buffer';

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

async function debugBucketAccess() {
  try {
    // Test with service role (should work)
    const _serviceSupabase = createClient(_supabaseUrl, _supabaseServiceKey);
    const { _data: _serviceBuckets, _error: _serviceError } =
      await _serviceSupabase.storage.listBuckets();

    _logError('Service role bucket listing failed', _serviceError);

    if (_serviceBuckets) {
      console.log(
        '✅ Service role can see buckets:',
        _serviceBuckets.map((_b) => _b.name)
      );
    }

    // Test with authenticated user
    const _userSupabase = createClient(_supabaseUrl, _supabaseServiceKey);

    // Sign in as admin
    const { _data: _authData, _error: _authError } =
      await _userSupabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123456',
      });

    _logError('Authentication failed', _authError);

    if (_authError) {
      return;
    }

    // Try to list buckets as authenticated user
    const { _data: _userBuckets, _error: _userError } =
      await _userSupabase.storage.listBuckets();

    _logError('Authenticated user bucket listing failed', _userError);

    if (_userBuckets) {
      console.log(
        '✅ Authenticated user can see buckets:',
        _userBuckets.map((_b) => _b.name)
      );
    }

    // Test direct upload attempt
    const _testFile = new File(['test content'], 'test-debug.txt', {
      type: 'text/plain',
    });

    const { _data: _uploadData, _error: _uploadError } =
      await _userSupabase.storage
        .from('documents')
        .upload('test-debug.txt', _testFile);

    _logError('Upload failed', _uploadError);

    if (_uploadData) {
      // Clean up
      await _userSupabase.storage.from('documents').remove(['test-debug.txt']);
      console.log('✅ Upload and cleanup successful');
    }
  } catch (_error) {
    console.error('❌ Unexpected error in bucket access debug:', _error);
  }
}

debugBucketAccess();
