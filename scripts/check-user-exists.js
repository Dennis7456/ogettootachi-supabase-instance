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

async function checkUserExists() {
  const email = 'webmastaz2019@gmail.com';
  
  try {
    console.log(`Checking if user exists: ${email}`);
    
    // Check auth.users table
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }
    
    const user = authUser.users.find(u => u.email === email);
    
    if (!user) {
      console.log('❌ User not found in auth.users table');
      console.log('Available users:');
      authUser.users.forEach(u => {
        console.log(`  - ${u.email} (${u.email_confirmed_at ? 'confirmed' : 'not confirmed'})`);
      });
      return;
    }
    
    console.log('✅ User found in auth.users table');
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`);
    console.log(`  - Created: ${user.created_at}`);
    console.log(`  - Last sign in: ${user.last_sign_in_at}`);
    
    // Check profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.log('❌ Profile not found in profiles table');
      console.log('Error:', profileError.message);
    } else {
      console.log('✅ Profile found in profiles table');
      console.log(`  - Full name: ${profile.full_name || 'Not set'}`);
      console.log(`  - Role: ${profile.role || 'Not set'}`);
      console.log(`  - Active: ${profile.is_active ? 'Yes' : 'No'}`);
      console.log(`  - Created: ${profile.created_at}`);
    }
    
  } catch (error) {
    console.error('Error checking user:', error);
  }
}

checkUserExists(); 