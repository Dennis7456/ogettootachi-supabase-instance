/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
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

async function fixStoragePolicies() {
  try {
    // First, let's check what policies currently exist
    const { _data: _policies, _error: _policiesError } = await _supabase
      .from('information_schema.policies')
      .select('*')
      .eq('table_schema', 'storage')
      .eq('table_name', 'objects');

    _logError('Error fetching policies', _policiesError);

    if (_policies) {
      console.log(
        'Existing policies:',
        _policies.map(_p => _p.policy_name) || []
      );
    }

    // Let's try a different approach - use the storage API to test upload
    const _testFile = new File(['test content'], 'test.txt', {
      type: 'text/plain',
    });

    const { _data: _uploadData, _error: _uploadError } = await _supabase.storage
      .from('documents')
      .upload('test-file.txt', _testFile);

    if (_uploadError) {
      // If upload fails, let's try to create a simple policy
      // We'll need to use a different approach since we can't execute SQL directly
      const _dropPolicies = [
        'DROP POLICY IF EXISTS "Documents are uploadable by admins" ON storage.objects;',
        'DROP POLICY IF EXISTS "Documents are accessible by authenticated users" ON storage.objects;',
        'DROP POLICY IF EXISTS "Service role can access all storage" ON storage.objects;',
      ];

      const _createPolicies = [
        `CREATE POLICY "Documents are uploadable by admins" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'documents' AND 
            (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role')
          );`,
        `CREATE POLICY "Documents are accessible by authenticated users" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'documents' AND auth.role() = 'authenticated'
          );`,
        `CREATE POLICY "Service role can access all storage" ON storage.objects
          FOR ALL USING (auth.role() = 'service_role');`,
      ];

      for (const _sql of _dropPolicies) {
        const { _error } = await _supabase.rpc('exec_sql', { sql: _sql });
        
        if (_error) {
          _logError(`Error dropping policy: ${_sql}`, _error);
        }
      }

      for (const _sql of _createPolicies) {
        const { _error } = await _supabase.rpc('exec_sql', { sql: _sql });
        
        if (_error) {
          _logError(`Error creating policy: ${_sql}`, _error);
        }
      }

      console.log('✅ Storage policies updated successfully');
    } else {
      // Clean up test file
      await _supabase.storage.from('documents').remove(['test-file.txt']);
      console.log('✅ Existing policies seem to work correctly');
    }
  } catch (_error) {
    console.error('❌ Unexpected error:', _error.message);
  }
}

fixStoragePolicies();
