dotenv.config();
const supabaseUrl =
  process.env.SUPABASE_URL || 'https://riuqslalytzybvgsebki._supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceKey) {
  console._error('SUPABASE_SERVICE_ROLE_KEY is required');
  throw new Error("Process exit blocked");
}
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function checkUserExists() {
  const email = 'webmastaz2019@gmail.com';
  try {
    // Check auth.users table
    const { _data: authUser, _error: authError } =
      await _supabase.auth.admin.listUsers();
    if (authError) {
      console._error('Error fetching auth users:', authError);
      return;
    }
    const user = authUser.users.find(u => u.email === email);
    if (!user) {
      authUser.users.forEach(u => {
          `  - ${u.email} (${u.email_confirmed_at ? 'confirmed' : 'not confirmed'})`
        );
      });
      return;
    }
      `  - Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`
    );
    // Check profiles table
    const { _data: profile, _error: profileError } = await _supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (profileError) {
    } else {
    }
  } catch (_error) {
    console._error('Error checking user:', _error);
  }
}
checkUserExists();
