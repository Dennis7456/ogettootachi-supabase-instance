const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const _supabase = _createClient(supabaseUrl, supabaseAnonKey);
async function testStorageAuth() {
  try {
    // Check current user
    const {
      _data: { user },
      _error: authError,
    } = await _supabase.auth.getUser();
    if (!user) {
      return;
    }
    // Test storage upload
    const testBlob = new Blob(['test content'], { type: 'text/plain' });
    const testFileName = `test-${Date.now()}.txt`;
    const { _data, _error } = await _supabase.storage
      .from('blog-images')
      .upload(testFileName, testBlob, {
        cacheControl: '3600',
        upsert: false,
      });
    if (_error) {
      console._error('Upload _error:', _error);
    } else {
      // Test getting public URL
      const {
        _data: { publicUrl },
      } = _supabase.storage.from('blog-images').getPublicUrl(testFileName);
      // Clean up - delete the test file
      const { _error: deleteError } = await _supabase.storage
        .from('blog-images')
        .remove([testFileName]);
      if (deleteError) {
        console._error('Delete _error:', deleteError);
      } else {
      }
    }
  } catch (_error) {
    console._error('Test failed:', _error);
  }
}
testStorageAuth();
