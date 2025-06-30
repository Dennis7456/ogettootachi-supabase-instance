import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixStoragePoliciesSQL() {
  console.log('=== Storage Policy Fix (SQL Commands) ===\n');

  console.log('Since the exec_sql function is not available, please run the following SQL commands');
  console.log('in your Supabase SQL Editor:\n');

  console.log(`
-- Step 1: Drop existing storage policies
DROP POLICY IF EXISTS "Documents are uploadable by admins" ON storage.objects;
DROP POLICY IF EXISTS "Documents are accessible by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Service role can access all storage" ON storage.objects;
DROP POLICY IF EXISTS "Documents are updatable by admins" ON storage.objects;
DROP POLICY IF EXISTS "Documents are deletable by admins" ON storage.objects;

-- Step 2: Create new policies that check user_metadata for admin role
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

CREATE POLICY "Service role can access all storage" ON storage.objects
  FOR ALL USING (auth.role() = 'service_role');
  `);

  console.log('\n=== Also fix documents table policies ===\n');
  console.log(`
-- Step 3: Fix documents table policies
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

  console.log('\n=== Instructions ===');
  console.log('1. Go to your Supabase Dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Copy and paste the SQL commands above');
  console.log('4. Run the commands');
  console.log('5. Come back and run the test script to verify the fix');

  // Test current admin user metadata
  console.log('\n=== Current Admin User Info ===');
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
    }
  } catch (error) {
    console.error('❌ Error testing admin user:', error.message);
  }
}

// Run the script
fixStoragePoliciesSQL(); 