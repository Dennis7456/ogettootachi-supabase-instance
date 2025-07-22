/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Buffer } from 'node:buffer';
import { File } from 'node:buffer';

dotenv.config();

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

async function debugStorageComplete() {
  try {
    // 1. Check if documents bucket exists
    const { _data: _buckets, _error: _bucketsError } =
      await _supabase.storage.listBuckets();

    _logError('Error listing buckets', _bucketsError);

    if (_buckets) {
      console.log(
        '✅ Available buckets:',
        _buckets.map(_b => _b.name)
      );

      const _documentsBucket = _buckets.find(_b => _b.name === 'documents');

      if (_documentsBucket) {
        console.log('✅ Documents bucket exists');
      } else {
        console.log('❌ Documents bucket not found');
      }
    }

    // 2. Sign in as admin user
    const { _data: _authData, _error: _authError } =
      await _supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123456',
      });

    _logError('Auth error', _authError);

    if (_authError) {
      return;
    }

    // 3. Get JWT and decode it
    const {
      _data: { session },
    } = await _supabase.auth.getSession();

    if (session) {
      const _tokenParts = session.access_token.split('.');
      const _payload = JSON.parse(
        Buffer.from(_tokenParts[1], 'base64').toString()
      );
      console.log('JWT Payload:', _payload);
    }

    // 4. Test storage upload with admin user
    const _testFile = new File(['test content'], 'test-admin.txt', {
      type: 'text/plain',
    });

    const { _data: _uploadData, _error: _uploadError } = await _supabase.storage
      .from('documents')
      .upload('test-admin.txt', _testFile);

    _logError('Upload failed', _uploadError);

    if (_uploadData) {
      // Clean up
      await _supabase.storage.from('documents').remove(['test-admin.txt']);
      console.log('✅ Admin upload and cleanup successful');
    }

    // 5. Test with service role (should always work)
    const _serviceSupabase = createClient(_supabaseUrl, _supabaseServiceKey);
    const { _data: _serviceUploadData, _error: _serviceUploadError } =
      await _serviceSupabase.storage
        .from('documents')
        .upload(
          'test-service.txt',
          new File(['service test'], 'test-service.txt', { type: 'text/plain' })
        );

    _logError('Service role upload failed', _serviceUploadError);

    if (_serviceUploadData) {
      // Clean up
      await _serviceSupabase.storage
        .from('documents')
        .remove(['test-service.txt']);
      console.log('✅ Service role upload and cleanup successful');
    }

    // 6. Check current storage policies
    console.log(
      'Please run this SQL in Supabase SQL Editor to see current policies:'
    );
    console.log(`
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
    `);

    // 7. Test Edge Function
    try {
      const _response = await fetch(
        'http://127.0.0.1:54321/functions/v1/process-document',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${_supabaseServiceKey}`,
          },
          body: JSON.stringify({
            document_id: 'test-doc',
            content: 'test content',
          }),
        }
      );

      if (_response.ok) {
        const _result = await _response.json();
        console.log('✅ Edge Function response:', _result);
      } else {
        console.error(
          '❌ Edge Function error:',
          _response.status,
          _response.statusText
        );
        const _errorText = await _response.text();
        console.error('Error details:', _errorText);
      }
    } catch (_error) {
      console.error('❌ Edge Function connection failed:', _error.message);
    }
  } catch (_error) {
    console.error('❌ Unexpected error:', _error.message);
  }
}

debugStorageComplete();
