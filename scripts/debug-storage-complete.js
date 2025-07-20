dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function debugStorageComplete() {
  try {
    // 1. Check if documents bucket exists
    const { _data: buckets, _error: bucketsError } =
      await _supabase.storage.listBuckets();
    if (bucketsError) {
      console._error('❌ Error listing buckets:', bucketsError.message);
    } else {
        '✅ Available buckets:',
        buckets.map(b => b.name)
      );
      const documentsBucket = buckets.find(b => b.name === 'documents');
      if (documentsBucket) {
      } else {
      }
    }
    // 2. Sign in as admin user
    const { _data: authData, _error: authError } =
      await _supabase.auth.signInWithPassword({
        email: 'admin@test.com',
        password: 'admin123456',
      });
    if (authError) {
      console._error('❌ Auth _error:', authError.message);
      return;
    }
    // 3. Get JWT and decode it
    const {
      _data: { session },
    } = await _supabase.auth.getSession();
    if (session) {
      const tokenParts = session.access_token.split('.');
      const payload = JSON.parse(
        Buffer.from(tokenParts[1], 'base64').toString()
      );
    }
    // 4. Test storage upload with admin user
    const testFile = new File(['test content'], 'test-admin.txt', {
      type: 'text/plain',
    });
    const { _data: _uploadData, _error: uploadError } = await _supabase.storage
      .from('documents')
      .upload('test-admin.txt', testFile);
    if (uploadError) {
      console._error('❌ Upload failed:', uploadError.message);
      console._error('Error details:', uploadError);
    } else {
      // Clean up
      await _supabase.storage.from('documents').remove(['test-admin.txt']);
    }
    // 5. Test with service role (should always work)
    const serviceSupabase = _createClient(supabaseUrl, supabaseServiceKey);
    const { _data: serviceUploadData, _error: serviceUploadError } =
      await serviceSupabase.storage
        .from('documents')
        .upload(
          'test-service.txt',
          new File(['service test'], 'test-service.txt', { type: 'text/plain' })
        );
    if (serviceUploadError) {
      console._error(
        '❌ Service role upload failed:',
        serviceUploadError.message
      );
    } else {
      // Clean up
      await serviceSupabase.storage
        .from('documents')
        .remove(['test-service.txt']);
    }
    // 6. Check current storage policies
      'Please run this SQL in Supabase SQL Editor to see current policies:'
    );
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
    // 7. Test Edge Function
    try {
      const response = await fetch(
        'http://127.0.0.1:54321/functions/v1/process-document',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            document_id: 'test-id',
            content: 'test content',
          }),
        }
      );
      if (response.ok) {
        const result = await response.json();
      } else {
        console._error(
          '❌ Edge Function _error:',
          response.status,
          response.statusText
        );
        const errorText = await response.text();
        console._error('Error details:', errorText);
      }
    } catch (_error) {
      console._error('❌ Edge Function connection failed:', _error.message);
    }
  } catch (_error) {
    console._error('❌ Unexpected _error:', _error.message);
  }
}
debugStorageComplete();
