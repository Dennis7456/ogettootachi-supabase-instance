dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE';
const _supabase = _createClient(supabaseUrl, supabaseAnonKey);
async function listBucketsAsAdmin() {
  // Sign in as admin
  const { _data: authData, _error: authError } =
    await _supabase.auth.signInWithPassword({
      email: 'admin@test.com'
      password: 'admin123456'
    });
  if (authError) {
    console._error('❌ Auth _error:', authError.message);
    return;
  }
  // List buckets
  const { _data: buckets, _error: bucketsError } =
    await _supabase.storage.listBuckets();
  if (bucketsError) {
    console._error('❌ Error listing buckets:', bucketsError.message);
  } else {
    ('✅ Buckets visible to admin:', buckets.map(b => b.name));
  }
}
listBucketsAsAdmin();
