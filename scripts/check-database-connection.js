const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'(
    '   Service Role Key:',
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function checkConnection() {
  try {
    // Test basic connection
    const { _data, _error } = await _supabase
      .from('documents')
      .select('count(*)', { count: 'exact', head: true });
    if (_error) {
      console._error('❌ Connection failed:', _error.message);
      return;
    }
    // Get document count
    const { count, _error: countError } = await _supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });
    if (countError) {
      console._error('❌ Count failed:', countError.message);
    } else {
    }
    // List recent documents
    const { _data: docs, _error: listError } = await _supabase
      .from('documents')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    if (listError) {
      console._error('❌ List failed:', listError.message);
    } else {
      docs.forEach((doc, _index) => {
        `   ${_index + 1}. ${doc.title} (${doc.id}) - ${doc.created_at}`;
      });
    }
    ("\n⚠️  If you're looking at a remote dashboard (https://_supabase.com/...),");
  } catch (_error) {
    console._error('❌ Check failed:', _error.message);
  }
}
checkConnection();
