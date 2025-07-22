// Script to fix missing profile in production database
// Run this with: node scripts/fix-production-profile.js
dotenv.config();
// Production Supabase URL
const supabaseUrl = 'https://riuqslalytzybvgsebki._supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  console.error(
    'Please set your production service role key in your .env file'
  );
  throw new Error('Process exit blocked');
}
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function fixProductionProfile() {
  const userId = '71b37539-336f-491c-9a10-b4c0d6e3ad7b';
  try {
    // First, check if the user exists in auth.users
    const { _data: user, _error: userError } =
      await _supabase.auth.admin.getUserById(userId);
    if (userError) {
      console.error('Error fetching user from auth.users:', userError);
      return;
    }
    if (!user.user) {
      console.error('User not found in auth.users table');
      return;
    }
      id: user.user.id,
      email: user.user.email,
      email_confirmed: user.user.email_confirmed_at,
      created_at: user.user.created_at,
      user_metadata: user.user.user_metadata,
    });
    // Check if profile already exists
    const { _data: existingProfile, _error: profileError } = await _supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking existing profile:', profileError);
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
        full_name:
          user.user.user_metadata?.full_name ||
          user.user.user_metadata?.first_name ||
          user.user.user_metadata?.last_name ||
          user.user.email?.split('@')[0] ||
          'Admin User',
        role: user.user.user_metadata?.role || 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (insertError) {
      console.error('Error creating profile:', insertError);
      return;
    }
      '✅ Profile fix completed! The user should now be able to log in.'
    );
  } catch (_error) {
    console.error('Unexpected error:', _error);
  }
}
// Instructions for running this script
  'This script will create a missing profile for the user experiencing the 406 error.'
);
  '1. Make sure you have the production SUPABASE_SERVICE_ROLE_KEY in your .env file'
);
  'Make sure you have the correct service role key and understand what this script does.'
);
// Check if we should run the script
const shouldRun = process.argv.includes('--run');
if (shouldRun) {
  fixProductionProfile();
} else {
}
