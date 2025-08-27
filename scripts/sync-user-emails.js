// Standalone script to sync user emails
// Run with: node sync-user-emails.js

import { createClient } from '@supabase/supabase-js';

// Production Supabase configuration
const supabaseUrl = 'https://szbjuskqrfthmjehknly.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Ymp1c2txcmZ0aG1qZWhrbmx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQzNTg5OSwiZXhwIjoyMDY5MDExODk5fQ.cMrSpRsKWhU0OM9wpRtrhOFj-6HHzS-lVOJ91YCnepU';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function syncUserEmails() {
  try {
    console.log('🔍 Starting email sync for REMOTE Supabase...');
    console.log('🌐 Supabase URL:', supabaseUrl);

    // Get all auth users
    console.log('🔍 Fetching auth users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }

    console.log('✅ Auth users loaded:', authUsers.users.length);

    // Get all profiles
    console.log('🔍 Fetching profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log('✅ Profiles loaded:', profiles.length);

    // Create a map of profile IDs to existing emails
    const profileEmailMap = {};
    profiles.forEach(profile => {
      profileEmailMap[profile.id] = profile.email;
    });

    // Update profiles with missing emails
    let updatedCount = 0;
    let errors = [];

    for (const authUser of authUsers.users) {
      const existingEmail = profileEmailMap[authUser.id];
      
      // Update if email is missing or different
      if (!existingEmail || existingEmail !== authUser.email) {
        console.log(`🔄 Updating profile for user ${authUser.id}: ${existingEmail || 'No email'} -> ${authUser.email}`);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            email: authUser.email,
            updated_at: new Date().toISOString()
          })
          .eq('id', authUser.id);

        if (updateError) {
          console.error(`❌ Error updating profile for user ${authUser.id}:`, updateError);
          errors.push({ userId: authUser.id, error: updateError.message });
        } else {
          updatedCount++;
        }
      }
    }

    console.log(`✅ Sync completed. Updated ${updatedCount} profiles.`);
    
    if (errors.length > 0) {
      console.log('❌ Errors:', errors);
    }

  } catch (error) {
    console.error('❌ Server error:', error);
  }
}

syncUserEmails(); 