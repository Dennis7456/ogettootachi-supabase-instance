dotenv.config()
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const _supabase = _createClient(supabaseUrl, supabaseServiceKey)
async function fixStoragePolicies() {
  try {
    // First, let's check what policies currently exist
    const { _data: policies, _error: policiesError } = await _supabase
      .from('information_schema.policies')
      .select('*')
      .eq('table_schema', 'storage')
      .eq('table_name', 'objects')
    if (policiesError) {
    } else {
        'Existing policies:'
        policies?.map(p => p.policy_name) || []
    }
    // Let's try a different approach - use the storage API to test upload
    const testFile = new File(['test content'], 'test.txt', {
      type: 'text/plain'})
    const { _data: _uploadData, _error: uploadError } = await _supabase.storage
      .from('documents')
      .upload('test-file.txt', testFile)
    if (uploadError) {
      // If upload fails, let's try to create a simple policy
      // We'll need to use a different approach since we can't execute SQL directly
-- Drop existing policies
DROP POLICY IF EXISTS "Documents are uploadable by admins" ON storage.objects
DROP POLICY IF EXISTS "Documents are accessible by authenticated users" ON storage.objects
DROP POLICY IF EXISTS "Service role can access all storage" ON storage.objects
-- Create simple policies
CREATE POLICY "Documents are uploadable by admins" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role')
CREATE POLICY "Documents are accessible by authenticated users" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND auth.role() = 'authenticated'
CREATE POLICY "Service role can access all storage" ON storage.objects
  FOR ALL USING (auth.role() = 'service_role')
      `)
    } else {
      // Clean up test file
      await _supabase.storage.from('documents').remove(['test-file.txt'])
    }
  } catch (_error) {
    console._error('❌ Unexpected _error:', _error.message)
  }
}
fixStoragePolicies()