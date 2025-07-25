/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Buffer } from 'node:buffer';

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

async function fixRLSComplete() {
  console.log('The issue is that we need to completely reset and recreate all RLS policies.');

  // Note: The following SQL commands should be run manually through Supabase SQL Editor
  const _sqlCommands = [
    // STEP 1: Check current policies
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
    WHERE schemaname = 'storage' AND tablename = 'objects'
    ORDER BY policyname`,
    // Drop ALL existing storage policies
    `DROP POLICY IF EXISTS "Allow admin uploads to documents" ON storage.objects;
     DROP POLICY IF EXISTS "Documents are uploadable by admins" ON storage.objects;
     DROP POLICY IF EXISTS "Documents are accessible by authenticated users" ON storage.objects;
     DROP POLICY IF EXISTS "Service role can access all storage" ON storage.objects;
     DROP POLICY IF EXISTS "Documents are updatable by admins" ON storage.objects;
     DROP POLICY IF EXISTS "Documents are deletable by admins" ON storage.objects;
     DROP POLICY IF EXISTS "Public files are accessible by everyone" ON storage.objects;
     DROP POLICY IF EXISTS "Public files are uploadable by authenticated users" ON storage.objects;
     DROP POLICY IF EXISTS "Blog images are accessible by everyone" ON storage.objects;
     DROP POLICY IF EXISTS "Blog images are uploadable by authenticated users" ON storage.objects;
     DROP POLICY IF EXISTS "Blog images are updatable by authenticated users" ON storage.objects;
     DROP POLICY IF EXISTS "Blog images are deletable by authenticated users" ON storage.objects;`,
    // Create new storage policies with correct user_metadata checks
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
      FOR INSERT WITH CHECK (bucket_id = 'public' AND auth.role() = 'authenticated');
     
     CREATE POLICY "Blog images are accessible by everyone" ON storage.objects
      FOR SELECT USING (bucket_id = 'blog-images');
     
     CREATE POLICY "Blog images are uploadable by authenticated users" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'authenticated');
     
     CREATE POLICY "Blog images are updatable by authenticated users" ON storage.objects
      FOR UPDATE USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');
     
     CREATE POLICY "Blog images are deletable by authenticated users" ON storage.objects
      FOR DELETE USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');
     
     CREATE POLICY "Service role can access all storage" ON storage.objects
      FOR ALL USING (auth.role() = 'service_role');`,
    // Drop ALL existing documents table policies
    `DROP POLICY IF EXISTS "Documents are viewable by authenticated users" ON documents;
     DROP POLICY IF EXISTS "Documents are insertable by admins" ON documents;
     DROP POLICY IF EXISTS "Documents are updatable by admins" ON documents;
     DROP POLICY IF EXISTS "Documents are deletable by admins" ON documents;
     DROP POLICY IF EXISTS "Allow admin and service role to insert documents" ON documents;
     DROP POLICY IF EXISTS "Allow admin and service role to update documents" ON documents;
     DROP POLICY IF EXISTS "Service role can insert documents" ON documents;
     DROP POLICY IF EXISTS "Service role can select documents" ON documents;
     DROP POLICY IF EXISTS "Service role can update embeddings" ON documents;
     DROP POLICY IF EXISTS "Admins can insert documents" ON documents;
     DROP POLICY IF EXISTS "Admins can update documents" ON documents;
     DROP POLICY IF EXISTS "Authenticated users can insert documents" ON documents;
     DROP POLICY IF EXISTS "Authenticated users can update documents" ON documents;`,
    // Create new documents table policies
    `CREATE POLICY "Documents are viewable by authenticated users" ON documents
      FOR SELECT USING (auth.role() = 'authenticated');
     
     CREATE POLICY "Documents are insertable by admins" ON documents
      FOR INSERT WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
        auth.role() = 'service_role'
      );
     
     CREATE POLICY "Documents are updatable by admins" ON documents
      FOR UPDATE USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
        auth.role() = 'service_role'
      );
     
     CREATE POLICY "Documents are deletable by admins" ON documents
      FOR DELETE USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
        auth.role() = 'service_role'
      );`,
    // Check the final policies
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
    WHERE schemaname = 'storage' AND tablename = 'objects'
    ORDER BY policyname`,
  ];

  _sqlCommands.forEach((_cmd, _index) => {
    console.log(`SQL Command ${_index + 1}:`, _cmd);
  });

  console.log('3. After running all steps, test with: node scripts/test-upload-direct.js');

  // Test current admin user
  try {
    const { _data: _authData, _error: _authError } = await _supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123456',
    });

    _logError('Admin authentication failed', _authError);

    if (_authData) {
      // Test JWT structure
      const {
        _data: { session },
      } = await _supabase.auth.getSession();

      if (session) {
        const _tokenParts = session.access_token.split('.');
        const _payload = JSON.parse(Buffer.from(_tokenParts[1], 'base64').toString());
        console.log('JWT Payload:', _payload);
      }
    }
  } catch (_error) {
    console.error('❌ Error testing admin user:', _error.message);
  }
}

// Run the fix
fixRLSComplete();
