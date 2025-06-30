import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSComplete() {
  console.log('=== Complete RLS Fix ===\n');

  console.log('The issue is that we need to completely reset and recreate all RLS policies.');
  console.log('Please run these SQL commands in your Supabase SQL Editor:\n');

  console.log(`
-- STEP 1: Check current policies
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
ORDER BY policyname;
  `);

  console.log('\n--- STEP 2: Drop ALL storage policies ---\n');
  console.log(`
-- Drop ALL existing storage policies
DROP POLICY IF EXISTS "Allow admin uploads to documents" ON storage.objects;
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
DROP POLICY IF EXISTS "Blog images are deletable by authenticated users" ON storage.objects;
  `);

  console.log('\n--- STEP 3: Create new storage policies ---\n');
  console.log(`
-- Create new storage policies with correct user_metadata checks
CREATE POLICY "Documents are uploadable by admins" ON storage.objects
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
  FOR ALL USING (auth.role() = 'service_role');
  `);

  console.log('\n--- STEP 4: Fix documents table policies ---\n');
  console.log(`
-- Drop ALL existing documents table policies
DROP POLICY IF EXISTS "Documents are viewable by authenticated users" ON documents;
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
DROP POLICY IF EXISTS "Authenticated users can update documents" ON documents;

-- Create new documents table policies
CREATE POLICY "Documents are viewable by authenticated users" ON documents
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
  );
  `);

  console.log('\n--- STEP 5: Verify policies ---\n');
  console.log(`
-- Check the final policies
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
ORDER BY policyname;
  `);

  console.log('\n=== Instructions ===');
  console.log('1. Run the SQL commands above in your Supabase SQL Editor');
  console.log('2. Make sure to run them in order (Step 1, then Step 2, etc.)');
  console.log('3. After running all steps, test with: node scripts/test-upload-direct.js');
  console.log('4. If it still fails, we may need to check bucket permissions');

  // Test current admin user
  console.log('\n=== Current Admin User Test ===');
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123456'
    });

    if (authError) {
      console.error('❌ Admin authentication failed:', authError.message);
    } else {
      console.log('✅ Admin authenticated:', authData.user.email);
      console.log('✅ User metadata:', authData.user.user_metadata);
      console.log('✅ Role in metadata:', authData.user.user_metadata.role);
      
      // Test JWT structure
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const tokenParts = session.access_token.split('.');
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log('\nJWT Structure:');
        console.log('- Main role:', payload.role);
        console.log('- User metadata role:', payload.user_metadata?.role);
        console.log('- Full user_metadata:', payload.user_metadata);
      }
    }
  } catch (error) {
    console.error('❌ Error testing admin user:', error.message);
  }
}

// Run the fix
fixRLSComplete(); 