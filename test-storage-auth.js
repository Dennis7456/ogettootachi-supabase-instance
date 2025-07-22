/* eslint-disable no-console, no-undef, no-unused-vars */
import { createClient } from '@supabase/supabase-js';
import { Blob } from 'node:buffer';

const _supabaseUrl = 'http://127.0.0.1:54321';
const _supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const _supabase = createClient(_supabaseUrl, _supabaseAnonKey);

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

async function testStorageAuth() {
  try {
    // Check current user
    const {
      _data: { user },
      _error: _authError,
    } = await _supabase.auth.getUser();

    _logError('Authentication error', _authError);

    if (!user) {
      console.log('No user authenticated');
      return;
    }

    // Test storage upload
    const _testBlob = new Blob(['test content'], { type: 'text/plain' });
    const _testFileName = `test-${Date.now()}.txt`;

    const { _data: _uploadData, _error: _uploadError } = await _supabase.storage
      .from('blog-images')
      .upload(_testFileName, _testBlob, {
        cacheControl: '3600',
        upsert: false,
      });

    _logError('Upload error', _uploadError);

    if (!_uploadError) {
      // Test getting public URL
      const {
        _data: { _publicUrl },
      } = _supabase.storage.from('blog-images').getPublicUrl(_testFileName);

      console.log('Public URL generated:', _publicUrl);

      // Clean up - delete the test file
      const { _error: _deleteError } = await _supabase.storage
        .from('blog-images')
        .remove([_testFileName]);

      _logError('Delete error', _deleteError);

      if (!_deleteError) {
        console.log('Test file deleted successfully');
      }
    }
  } catch (_error) {
    console.error('Test failed:', _error);
  }
}

testStorageAuth();
