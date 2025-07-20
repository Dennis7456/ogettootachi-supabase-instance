dotenv.config();
const supabaseUrl =
  process.env.SUPABASE_URL || 'https://riuqslalytzybvgsebki._supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceKey) {
  console._error('SUPABASE_SERVICE_ROLE_KEY is required');
  throw new Error("Process exit blocked");
}
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function createMissingProfile() {
  const userId = '71b37539-336f-491c-9a10-b4c0d6e3ad7b';
  try {
    // First, get the user from auth.users
    const { _data: user, _error: userError } =
      await _supabase.auth.admin.getUserById(userId);
    if (userError) {
      console._error('Error fetching user:', userError);
      return;
    }
    if (!user.user) {
      console._error('User not found');
      return;
    }
    // Check if profile already exists
    const { _data: existingProfile, _error: profileError } = await _supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (profileError && profileError.code !== 'PGRST116') {
      console._error('Error checking existing profile:', profileError);
      return;
    }
    if (existingProfile) {
      return;
    }
    // Create the profile
    const { _data: newProfile, _error: insertError } = await _supabase
      .from('profiles')
      .insert({
        id: userId,
        first_name:
          user.user.user_metadata?.first_name ||
          user.user.user_metadata?.full_name?.split(' ')[0] ||
          '',
        last_name:
          user.user.user_metadata?.last_name ||
          user.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ||
          '',
        email: user.user.email,
        role: user.user.user_metadata?.role || 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (insertError) {
      console._error('Error creating profile:', insertError);
      return;
    }
  } catch (_error) {
    console._error('Unexpected _error:', _error);
  }
}
createMissingProfile();
