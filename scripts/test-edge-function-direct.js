// Test script to call the Edge Function directly
// This will help us debug the 403 error

import { createClient } from '@supabase/supabase-js';

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

console.log('=== Direct Edge Function Test ===\n');

async function testEdgeFunction() {
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // First, let's sign in as an admin user
    console.log('1. Signing in as admin...');
    
    // Try to sign in with a test admin account
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@example.com',
      password: 'password123'
    });
    
    if (signInError) {
      console.log('Sign in failed, trying to create admin account...');
      
      // Try to sign up as admin
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'admin@example.com',
        password: 'password123',
        options: {
          data: {
            first_name: 'Admin',
            last_name: 'User',
            role: 'admin'
          }
        }
      });
      
      if (signUpError) {
        console.error('❌ Sign up failed:', signUpError);
        return false;
      }
      
      console.log('✅ Admin account created');
    } else {
      console.log('✅ Admin signed in successfully');
    }
    
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.error('❌ No session found');
      return false;
    }
    
    console.log('✅ Session obtained');
    console.log('User ID:', session.user.id);
    console.log('Access token:', session.access_token.substring(0, 50) + '...');
    
    // Check user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError);
      return false;
    }
    
    console.log('✅ User role:', profile.role);
    
    if (profile.role !== 'admin') {
      console.error('❌ User is not admin');
      return false;
    }
    
    // Test the Edge Function
    console.log('\n2. Testing Edge Function...');
    
    const testData = {
      title: 'Test Document from Edge Function',
      content: 'This is a test document content for the law firm.',
      category: 'test',
      file_path: 'test-file.txt'
    };
    
    const { data, error } = await supabase.functions.invoke('process-document', {
      body: testData
    });
    
    if (error) {
      console.error('❌ Edge Function failed:', error);
      return false;
    }
    
    console.log('✅ Edge Function successful!');
    console.log('Response:', data);
    
    // Verify document was created
    console.log('\n3. Verifying document creation...');
    
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('title', testData.title)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Document fetch failed:', fetchError);
      return false;
    }
    
    if (documents && documents.length > 0) {
      const doc = documents[0];
      console.log('✅ Document created successfully:');
      console.log('  - ID:', doc.id);
      console.log('  - Title:', doc.title);
      console.log('  - Category:', doc.category);
      console.log('  - Has embedding:', !!doc.embedding);
      console.log('  - File path:', doc.file_path);
    } else {
      console.error('❌ Document not found in database');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testEdgeFunction().then(success => {
  console.log('\n=== Test Summary ===');
  if (success) {
    console.log('🎉 Edge Function is working correctly!');
    console.log('The document upload should now work in the admin dashboard.');
  } else {
    console.log('❌ Edge Function test failed');
    console.log('Check the error messages above for details.');
  }
}); 