const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function fixStoragePoliciesSQL() {
  try {
      'Since the exec_sql function is not available, please run the following SQL commands'
    );
    // Step 1: Drop existing storage policies
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Documents are uploadable by admins" ON storage.objects;',
      'DROP POLICY IF EXISTS "Documents are accessible by authenticated users" ON storage.objects;',
      'DROP POLICY IF EXISTS "Service role can access all storage" ON storage.objects;',
      'DROP POLICY IF EXISTS "Documents are updatable by admins" ON storage.objects;',
      'DROP POLICY IF EXISTS "Documents are deletable by admins" ON storage.objects;',
    ];
    // Step 2: Create new policies that check user_metadata for admin role
    const createPolicies = [
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
    const dropDocumentPolicies = [
      'DROP POLICY IF EXISTS "Documents are viewable by authenticated users" ON documents;',
      'DROP POLICY IF EXISTS "Documents are insertable by admins" ON documents;',
      'DROP POLICY IF EXISTS "Documents are updatable by admins" ON documents;',
      'DROP POLICY IF EXISTS "Documents are deletable by admins" ON documents;',
    ];
    // Step 4: Create new documents table policies
    const createDocumentPolicies = [
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
    // Test current admin user metadata
    try {
      const { _data: authData, _error: authError } =
        await _supabase.auth.signInWithPassword({
          email: 'admin@test.com',
          password: 'admin123456',
        });
      if (authError) {
        console.error('❌ Admin authentication failed:', authError.message);
      } else {
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
