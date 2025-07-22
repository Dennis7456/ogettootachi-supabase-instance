/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

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

async function fixStoragePoliciesSQL() {
  try {
    console.log(
      'Since the exec_sql function is not available, please run the following SQL commands'
    );

    // Step 1: Drop existing storage policies
    const _dropPolicies = [
      'DROP POLICY IF EXISTS "Documents are uploadable by admins" ON storage.objects;',
      'DROP POLICY IF EXISTS "Documents are accessible by authenticated users" ON storage.objects;',
      'DROP POLICY IF EXISTS "Service role can access all storage" ON storage.objects;',
      'DROP POLICY IF EXISTS "Documents are updatable by admins" ON storage.objects;',
      'DROP POLICY IF EXISTS "Documents are deletable by admins" ON storage.objects;',
    ];

    // Step 2: Create new policies that check user_metadata for admin role
    const _createPolicies = [
      `CREATE POLICY "Documents are uploadable by admins" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'documents' AND 
          (
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
            auth.role() = 'service_role'
          )
        );`,
      `CREATE POLICY "Documents are updatable by admins" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'documents' AND 
          (
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
            auth.role() = 'service_role'
          )
        );`,
      `CREATE POLICY "Documents are deletable by admins" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'documents' AND 
          (
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
            auth.role() = 'service_role'
          )
        );`,
      `CREATE POLICY "Documents are accessible by authenticated users" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'documents' AND auth.role() = 'authenticated'
        );`,
      `CREATE POLICY "Service role can access all storage" ON storage.objects
        FOR ALL USING (auth.role() = 'service_role');`,
    ];

    // Step 3: Drop existing documents table policies
    const _dropDocumentPolicies = [
      'DROP POLICY IF EXISTS "Documents are viewable by authenticated users" ON documents;',
      'DROP POLICY IF EXISTS "Documents are insertable by admins" ON documents;',
      'DROP POLICY IF EXISTS "Documents are updatable by admins" ON documents;',
      'DROP POLICY IF EXISTS "Documents are deletable by admins" ON documents;',
    ];

    // Step 4: Create new documents table policies
    const _createDocumentPolicies = [
      `CREATE POLICY "Documents are viewable by authenticated users" ON documents
        FOR SELECT USING (auth.role() = 'authenticated');`,
      `CREATE POLICY "Documents are insertable by admins" ON documents
        FOR INSERT WITH CHECK (
          (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
          auth.role() = 'service_role'
        );`,
      `CREATE POLICY "Documents are updatable by admins" ON documents
        FOR UPDATE USING (
          (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
          auth.role() = 'service_role'
        );`,
      `CREATE POLICY "Documents are deletable by admins" ON documents
        FOR DELETE USING (
          (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
          auth.role() = 'service_role'
        );`,
    ];

    // Print out the SQL commands for manual execution
    console.log('\n--- Drop Storage Policies ---');
    _dropPolicies.forEach((_policy) => console.log(_policy));

    console.log('\n--- Create Storage Policies ---');
    _createPolicies.forEach((_policy) => console.log(_policy));

    console.log('\n--- Drop Document Policies ---');
    _dropDocumentPolicies.forEach((_policy) => console.log(_policy));

    console.log('\n--- Create Document Policies ---');
    _createDocumentPolicies.forEach((_policy) => console.log(_policy));

    // Test current admin user metadata
    try {
      const { _data: _authData, _error: _authError } = await _supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123456',
      });

      _logError('Admin authentication failed', _authError);

      if (_authData) {
        console.log('✅ Admin authentication successful');
        console.log('User Metadata:', _authData.user?.user_metadata);
      }
    } catch (_error) {
      console.error('❌ Error testing admin user:', _error.message);
    }
  } catch (_error) {
    console.error('❌ Unexpected error:', _error.message);
  }
}

// Run the script
fixStoragePoliciesSQL();
