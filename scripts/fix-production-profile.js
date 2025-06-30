// Script to fix missing profile in production database
// Run this with: node scripts/fix-production-profile.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Production Supabase URL
const supabaseUrl = 'https://riuqslalytzybvgsebki.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required');
  console.error('Please set your production service role key in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixProductionProfile() {
  const userId = '71b37539-336f-491c-9a10-b4c0d6e3ad7b';
  
  try {
    console.log(`Checking user ${userId} in production database...`);
    
    // First, check if the user exists in auth.users
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError) {
      console.error('Error fetching user from auth.users:', userError);
      return;
    }
    
    if (!user.user) {
      console.error('User not found in auth.users table');
      return;
    }
    
    console.log('User found in auth.users:', {
      id: user.user.id,
      email: user.user.email,
      email_confirmed: user.user.email_confirmed_at,
      created_at: user.user.created_at,
      user_metadata: user.user.user_metadata
    });
    
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
        full_name: user.user.user_metadata?.full_name || 
                   user.user.user_metadata?.first_name || 
                   user.user.user_metadata?.last_name || 
                   user.user.email?.split('@')[0] || 'Admin User',
        role: user.user.user_metadata?.role || 'admin',
        is_active: true,
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
    console.log('\n✅ Profile fix completed! The user should now be able to log in.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Instructions for running this script
console.log('=== Production Profile Fix Script ===');
console.log('');
console.log('This script will create a missing profile for the user experiencing the 406 error.');
console.log('');
console.log('To run this script:');
console.log('1. Make sure you have the production SUPABASE_SERVICE_ROLE_KEY in your .env file');
console.log('2. Run: node scripts/fix-production-profile.js');
console.log('');
console.log('⚠️  WARNING: This script modifies the production database!');
console.log('Make sure you have the correct service role key and understand what this script does.');
console.log('');

// Check if we should run the script
const shouldRun = process.argv.includes('--run');
if (shouldRun) {
  fixProductionProfile();
} else {
  console.log('To actually run the script, add --run flag:');
  console.log('node scripts/fix-production-profile.js --run');
} 