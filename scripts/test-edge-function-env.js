// Test script for Edge Function environment variables
// Run this to check if the service role key is properly configured

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// For local development, the service role key is typically:
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

console.log('=== Edge Function Environment Test ===\n');

// Test 1: Check if we can create clients
console.log('1. Testing Supabase client creation...');
try {
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
  console.log('✅ Both clients created successfully');
} catch (error) {
  console.error('❌ Client creation failed:', error.message);
}

// Test 2: Test service role permissions
console.log('\n2. Testing service role permissions...');
async function testServiceRole() {
  try {
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test if service role can read documents
    const { data, error } = await supabaseService
      .from('documents')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Service role read failed:', error.message);
      return false;
    }
    
    console.log('✅ Service role can read documents');
    
    // Test if service role can insert documents (should work)
    const testDoc = {
      title: 'Test Document',
      content: 'Test content for service role test',
      category: 'test'
    };
    
    const { data: insertData, error: insertError } = await supabaseService
      .from('documents')
      .insert(testDoc)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Service role insert failed:', insertError.message);
      return false;
    }
    
    console.log('✅ Service role can insert documents');
    
    // Clean up test document
    await supabaseService
      .from('documents')
      .delete()
      .eq('id', insertData.id);
    
    console.log('✅ Test document cleaned up');
    return true;
  } catch (error) {
    console.error('❌ Service role test failed:', error.message);
    return false;
  }
}

// Test 3: Check environment variables for Edge Functions
console.log('\n3. Checking Edge Function environment setup...');
console.log('To set up Edge Function environment variables, run:');
console.log('');
console.log('supabase secrets set SUPABASE_URL=http://127.0.0.1:54321');
console.log('supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0');
console.log('supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU');
console.log('supabase secrets set OPENAI_API_KEY=your_openai_api_key_here');
console.log('');

// Test 4: Check current secrets
console.log('4. Checking current secrets...');

try {
  const secrets = execSync('supabase secrets list', { encoding: 'utf8' });
  console.log('Current secrets:');
  console.log(secrets);
} catch (error) {
  console.log('❌ Could not list secrets. Make sure you\'re in the supabase directory.');
  console.log('Error:', error.message);
}

// Run the service role test
testServiceRole().then(success => {
  console.log('\n=== Test Summary ===');
  if (success) {
    console.log('✅ Service role is working correctly');
    console.log('✅ Edge Function should work with proper environment variables');
  } else {
    console.log('❌ Service role has issues');
    console.log('❌ Check RLS policies and database permissions');
  }
  
  console.log('\nNext steps:');
  console.log('1. Set up the environment variables using the commands above');
  console.log('2. Deploy the Edge Function: supabase functions deploy process-document');
  console.log('3. Test the document upload functionality');
}); 