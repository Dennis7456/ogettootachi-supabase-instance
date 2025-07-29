import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Create Supabase client with anon key
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function testDeleteUser() {
  console.log('Testing user deletion...');

  try {
    // Step 1: Create a test user
    const timestamp = new Date().getTime();
    const userData = {
      email: `test-delete-${timestamp}@example.com`,
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'Delete',
    };
    
    console.log('Creating test user:', userData.email);
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
        },
      },
    });
    
    if (signUpError) {
      console.error('❌ Failed to create test user:', signUpError);
      return false;
    }
    
    console.log('✅ Test user created:', signUpData.user.id);
    
    // Create profile for the user
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: signUpData.user.id,
        full_name: `${userData.firstName} ${userData.lastName}`,
        role: 'user',
        is_active: true,
        email: userData.email,
      },
      {
        onConflict: 'id',
      }
    );
    
    if (profileError) {
      console.error('❌ Failed to create profile:', profileError);
    } else {
      console.log('✅ Profile created successfully');
    }
    
    // Wait a moment for the user to be fully created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Delete the user using our custom function
    console.log('Deleting user using delete_user_safely function...');
    
    const { data: deleteResult, error: deleteError } = await supabaseAdmin.rpc(
      'delete_user_safely',
      { p_user_id: signUpData.user.id }
    );
    
    if (deleteError) {
      console.error('❌ Failed to delete user:', deleteError);
      return false;
    }
    
    console.log('Delete result:', deleteResult);
    
    // Step 3: Verify the user is deleted
    const { data: userData2, error: userError } = await supabaseAdmin.auth.admin.getUserById(
      signUpData.user.id
    );
    
    if (userError) {
      console.log('✅ User not found, which is expected if deletion was successful');
    } else if (userData2) {
      console.error('❌ User still exists after deletion:', userData2);
      return false;
    }
    
    // Check if profile was deleted
    const { data: profileData, error: profileQueryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signUpData.user.id);
    
    if (profileQueryError) {
      console.error('❌ Error checking profile:', profileQueryError);
    } else if (profileData && profileData.length > 0) {
      console.error('❌ Profile still exists after user deletion:', profileData);
    } else {
      console.log('✅ Profile was successfully deleted');
    }
    
    console.log('✅ User deletion test completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Test failed with unexpected error:', error);
    return false;
  }
}

testDeleteUser(); 