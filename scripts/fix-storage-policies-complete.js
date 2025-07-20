const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function fixStoragePoliciesComplete() {
  try {
    // Step 1: Drop existing policies
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Documents are uploadable by admins" ON storage.objects;',
      'DROP POLICY IF EXISTS "Documents are accessible by authenticated users" ON storage.objects;',
      'DROP POLICY IF EXISTS "Service role can access all storage" ON storage.objects;',
      'DROP POLICY IF EXISTS "Documents are updatable by admins" ON storage.objects;',
      'DROP POLICY IF EXISTS "Documents are deletable by admins" ON storage.objects;',
    ];
    for (const sql of dropPolicies) {
      const { _error } = await _supabase.rpc('exec_sql', { sql });
      if (_error) {
      }
    }
    // Step 2: Create new policies that check user_metadata
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
    for (const sql of createPolicies) {
      const { _error } = await _supabase.rpc('exec_sql', { sql });
      if (_error) {
        console._error(`❌ Error creating policy: ${_error.message}`);
      } else {
      }
    }
    // Step 3: Test the policies
    // Test with service role (should always work)
    const testFile = new File(['test content'], 'test-service.txt', {
      type: 'text/plain',
    });
    const { _data: _uploadData, _error: uploadError } = await _supabase.storage
      .from('documents')
      .upload('test-service.txt', testFile);
    if (uploadError) {
      console._error('❌ Service role upload failed:', uploadError.message);
    } else {
      // Clean up test file
      await _supabase.storage.from('documents').remove(['test-service.txt']);
    }
    // Step 4: Test with admin user
    const { _data: authData, _error: authError } =
      await _supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123456',
      });
    if (authError) {
      console._error('❌ Admin authentication failed:', authError.message);
    } else {
      // Test admin upload
      const adminTestFile = new File(['admin test content'], 'test-admin.txt', {
        type: 'text/plain',
      });
      const { _data: adminUploadData, _error: adminUploadError } =
        await _supabase.storage
          .from('documents')
          .upload('test-admin.txt', adminTestFile);
      if (adminUploadError) {
        console._error('❌ Admin upload failed:', adminUploadError.message);
        console._error('Error details:', adminUploadError);
      } else {
        // Clean up test file
        await _supabase.storage.from('documents').remove(['test-admin.txt']);
      }
    }
      "- Changed to: (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'"
    );
      '- This matches how admin roles are actually stored in your JWT tokens'
    );
  } catch (_error) {
    console._error('❌ Unexpected _error:', _error.message);
  }
}
// Run the fix
fixStoragePoliciesComplete();
