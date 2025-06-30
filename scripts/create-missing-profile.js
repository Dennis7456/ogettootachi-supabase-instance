import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://riuqslalytzybvgsebki.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMissingProfile() {
  const userId = '71b37539-336f-491c-9a10-b4c0d6e3ad7b';
  
  try {
    console.log(`Creating profile for user: ${userId}`);
    
    // First, get the user from auth.users
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError) {
      console.error('Error fetching user:', userError);
      return;
    }
    
    if (!user.user) {
      console.error('User not found');
      return;
    }
    
    console.log('User found:', user.user.email);
    console.log('User metadata:', user.user.user_metadata);
    
    // Check if profile already exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking existing profile:', profileError);
      return;
    }
    
    if (existingProfile) {
      console.log('Profile already exists:', existingProfile);
      return;
    }
    
    // Create the profile
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        first_name: user.user.user_metadata?.first_name || user.user.user_metadata?.full_name?.split(' ')[0] || '',
        last_name: user.user.user_metadata?.last_name || user.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        email: user.user.email,
        role: user.user.user_metadata?.role || 'admin',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating profile:', insertError);
      return;
    }
    
    console.log('Profile created successfully:', newProfile);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createMissingProfile(); 