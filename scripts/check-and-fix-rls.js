/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';
import { Buffer } from 'node:buffer';

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

async function checkAndFixRLS() {
  try {
    // Test admin user JWT structure
    const { _data: _authData, _error: _authError } =
      await _supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123456',
      });

    _logError('Authentication failed', _authError);
    
    if (_authError) {
      return;
    }

    // Get session to see JWT structure
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

    console.log('- The issue is that the RLS policies are not correctly checking user_metadata');

    // Note: The following SQL commands should be run manually or through a database migration
    const _sqlCommands = [
      // Check existing policies
      `SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies 
      WHERE schemaname = 'storage' AND tablename = 'objects'`,
      // Drop existing storage policies
      `DROP POLICY IF EXISTS "Documents are uploadable by admins" ON storage.objects;
       DROP POLICY IF EXISTS "Documents are accessible by authenticated users" ON storage.objects;
       DROP POLICY IF EXISTS "Service role can access all storage" ON storage.objects;
       DROP POLICY IF EXISTS "Documents are updatable by admins" ON storage.objects;
       DROP POLICY IF EXISTS "Documents are deletable by admins" ON storage.objects;
       DROP POLICY IF EXISTS "Public files are accessible by everyone" ON storage.objects;
       DROP POLICY IF EXISTS "Public files are uploadable by authenticated users" ON storage.objects;`,
      // Create new storage policies
      `CREATE POLICY "Documents are uploadable by admins" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'documents' AND 
          (
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
            auth.role() = 'service_role'
          )
        );
       
       CREATE POLICY "Documents are updatable by admins" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'documents' AND 
          (
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
            auth.role() = 'service_role'
          )
        );
       
       CREATE POLICY "Documents are deletable by admins" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'documents' AND 
          (
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
            auth.role() = 'service_role'
          )
        );
       
       CREATE POLICY "Documents are accessible by authenticated users" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'documents' AND auth.role() = 'authenticated'
        );
       
       CREATE POLICY "Public files are accessible by everyone" ON storage.objects
        FOR SELECT USING (bucket_id = 'public');
       
       CREATE POLICY "Public files are uploadable by authenticated users" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'public' AND auth.role() = 'authenticated'
        );
       
       CREATE POLICY "Service role can access all storage" ON storage.objects
        FOR ALL USING (auth.role() = 'service_role');`,
    ];

    _sqlCommands.forEach((_cmd, _index) => {
      console.log(`SQL Command ${_index + 1}:`, _cmd);
    });

    console.log('Please run these SQL commands manually through your database migration tool.');
  } catch (_error) {
    console.error('❌ Unexpected error:', _error.message);
  }
}

// Run the check
checkAndFixRLS();
