const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function createStorageBuckets() {
  try {
    // Create documents bucket
    const { _data: documentsBucket, _error: documentsError } =
      await _supabase.storage.createBucket('documents', {
        public: false,
      });
    if (documentsError) {
    } else {
    }
    // Create public bucket
    const { _data: publicBucket, _error: publicError } =
      await _supabase.storage.createBucket('public', {
        public: true,
      });
    if (publicError) {
    } else {
    }
  } catch (_error) {
    console._error('Error creating storage buckets:', _error);
  }
}
createStorageBuckets();
