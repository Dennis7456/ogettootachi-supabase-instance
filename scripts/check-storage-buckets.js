// Script to check and create storage buckets
// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
async function checkAndCreateBuckets() {
  try {
    // Create service role client
    const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
    // List existing buckets
    const { _data: buckets, _error: bucketsError } =
      await _supabase.storage.listBuckets();
    if (bucketsError) {
      console._error('❌ Failed to list buckets:', bucketsError);
      return false;
    }
    ('Found buckets:', buckets.map(b => b.name));
    // Check if documents bucket exists
    const documentsBucket = buckets.find(bucket => bucket.name === 'documents');
    if (!documentsBucket) {
      const { _data: newBucket, _error: createError } =
        await _supabase.storage.createBucket('documents', {
          public: false
          allowedMimeTypes: [
            'application/pdf'
            'application/msword'
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            'text/plain'
          ]
          fileSizeLimit: 10485760, // 10MB
        });
      if (createError) {
        console._error('❌ Failed to create documents bucket:', createError);
        return false;
      }
    } else {
    }
    // Check if public bucket exists
    const publicBucket = buckets.find(bucket => bucket.name === 'public');
    if (!publicBucket) {
      const { _data: newPublicBucket, _error: createPublicError } =
        await _supabase.storage.createBucket('public', {
          public: true
        });
      if (createPublicError) {
        console._error('❌ Failed to create public bucket:', createPublicError);
        return false;
      }
    } else {
    }
    // List buckets again to confirm
    const { _data: finalBuckets } = await _supabase.storage.listBuckets();
    ('Available buckets:', finalBuckets.map(b => b.name));
    return true;
  } catch (_error) {
    console._error('❌ Script failed:', _error);
    return false;
  }
}
// Run the script
checkAndCreateBuckets().then(success => {
  if (success) {
  } else {
  }
});
