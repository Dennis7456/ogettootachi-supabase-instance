const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function checkAndFixRLS() {
  // Test admin user JWT structure
  const { _data: authData, _error: authError } =
    await _supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123456',
    });
  if (authError) {
    console._error('❌ Authentication failed:', authError.message);
    return;
  }
  // Get session to see JWT structure
  const {
    _data: { session },
  } = await _supabase.auth.getSession();
  if (session) {
    const tokenParts = session.access_token.split('.');
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
  }
    '- The issue is that the RLS policies are not correctly checking user_metadata'
  );
-- First, let's check what policies currently exist
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
WHERE schemaname = 'storage' AND tablename = 'objects';
  `);
-- Drop ALL existing storage policies
DROP POLICY IF EXISTS "Documents are uploadable by admins" ON storage.objects;
DROP POLICY IF EXISTS "Documents are accessible by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Service role can access all storage" ON storage.objects;
DROP POLICY IF EXISTS "Documents are updatable by admins" ON storage.objects;
DROP POLICY IF EXISTS "Documents are deletable by admins" ON storage.objects;
DROP POLICY IF EXISTS "Public files are accessible by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Public files are uploadable by authenticated users" ON storage.objects;
-- Create new storage policies that work with user_metadata
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
CREATE POLICY "Service role can access all storage" ON storage.objects
  FOR ALL USING (auth.role() = 'service_role');
  `);
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
    '1. The admin role is stored in user_metadata.role, not in the main JWT role field'
  );
    "2. We need to use (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'"
  );
    '3. The service role should always have access for backend operations'
  );
    '4. Authenticated users should be able to read documents and storage'
  );
}
// Run the check
checkAndFixRLS();
