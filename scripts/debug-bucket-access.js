import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function debugBucketAccess() {
  console.log('=== Debugging Bucket Access ===\n');

  // Test with service role (should work)
  console.log('1. Testing with Service Role...');
  const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: serviceBuckets, error: serviceError } = await serviceSupabase.storage.listBuckets();
  
  if (serviceError) {
    console.error('❌ Service role bucket listing failed:', serviceError.message);
  } else {
    console.log('✅ Service role can see buckets:', serviceBuckets.map(b => b.name));
  }

  // Test with authenticated user
  console.log('\n2. Testing with Authenticated User...');
  const userSupabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Sign in as admin
  const { data: authData, error: authError } = await userSupabase.auth.signInWithPassword({
    email: 'admin@test.com',
    password: 'admin123456'
  });

  if (authError) {
    console.error('❌ Authentication failed:', authError.message);
    return;
  }

  console.log('✅ User authenticated:', authData.user.email);

  // Try to list buckets as authenticated user
  const { data: userBuckets, error: userError } = await userSupabase.storage.listBuckets();
  
  if (userError) {
    console.error('❌ Authenticated user bucket listing failed:', userError.message);
  } else {
    console.log('✅ Authenticated user can see buckets:', userBuckets.map(b => b.name));
  }

  // Test direct upload attempt
  console.log('\n3. Testing Direct Upload...');
  const testFile = new File(['test content'], 'test-debug.txt', { type: 'text/plain' });
  
  const { data: uploadData, error: uploadError } = await userSupabase.storage
    .from('documents')
    .upload('test-debug.txt', testFile);

  if (uploadError) {
    console.error('❌ Upload failed:', uploadError.message);
    console.error('Error details:', uploadError);
  } else {
    console.log('✅ Upload succeeded:', uploadData.path);
    
    // Clean up
    await userSupabase.storage.from('documents').remove(['test-debug.txt']);
    console.log('✅ Test file cleaned up');
  }

  console.log('\n=== Debug Complete ===');
}

// Run the debug
debugBucketAccess(); 