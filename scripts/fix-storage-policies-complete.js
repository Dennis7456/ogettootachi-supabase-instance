import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixStoragePoliciesComplete() {
  console.log('=== Complete Storage Policy Fix ===\n');

  try {
    // Step 1: Drop existing policies
    console.log('1. Dropping existing storage policies...');
    const dropPolicies = [
      'DROP POLICY IF EXISTS "Documents are uploadable by admins" ON storage.objects;',
      'DROP POLICY IF EXISTS "Documents are accessible by authenticated users" ON storage.objects;',
      'DROP POLICY IF EXISTS "Service role can access all storage" ON storage.objects;',
      'DROP POLICY IF EXISTS "Documents are updatable by admins" ON storage.objects;',
      'DROP POLICY IF EXISTS "Documents are deletable by admins" ON storage.objects;'
    ];

    for (const sql of dropPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.log(`⚠️ Warning dropping policy: ${error.message}`);
      }
    }

    // Step 2: Create new policies that check user_metadata
    console.log('\n2. Creating new storage policies...');
    const createPolicies = [
      `CREATE POLICY "Documents are uploadable by admins" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'documents' AND 
          (
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
            auth.role() = 'service_role'
          )
        );`,
      
      `CREATE POLICY "Documents are updatable by admins" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'documents' AND 
          (
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
            auth.role() = 'service_role'
          )
        );`,
      
      `CREATE POLICY "Documents are deletable by admins" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'documents' AND 
          (
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
            auth.role() = 'service_role'
          )
        );`,
      
      `CREATE POLICY "Documents are accessible by authenticated users" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'documents' AND auth.role() = 'authenticated'
        );`,
      
      `CREATE POLICY "Service role can access all storage" ON storage.objects
        FOR ALL USING (auth.role() = 'service_role');`
    ];

    for (const sql of createPolicies) {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.error(`❌ Error creating policy: ${error.message}`);
      } else {
        console.log('✅ Policy created successfully');
      }
    }

    // Step 3: Test the policies
    console.log('\n3. Testing storage access...');
    
    // Test with service role (should always work)
    const testFile = new File(['test content'], 'test-service.txt', { type: 'text/plain' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload('test-service.txt', testFile);

    if (uploadError) {
      console.error('❌ Service role upload failed:', uploadError.message);
    } else {
      console.log('✅ Service role upload succeeded');
      
      // Clean up test file
      await supabase.storage.from('documents').remove(['test-service.txt']);
    }

    // Step 4: Test with admin user
    console.log('\n4. Testing admin user authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123456'
    });

    if (authError) {
      console.error('❌ Admin authentication failed:', authError.message);
    } else {
      console.log('✅ Admin authenticated:', authData.user.email);
      console.log('User metadata:', authData.user.user_metadata);
      
      // Test admin upload
      const adminTestFile = new File(['admin test content'], 'test-admin.txt', { type: 'text/plain' });
      
      const { data: adminUploadData, error: adminUploadError } = await supabase.storage
        .from('documents')
        .upload('test-admin.txt', adminTestFile);

      if (adminUploadError) {
        console.error('❌ Admin upload failed:', adminUploadError.message);
        console.error('Error details:', adminUploadError);
      } else {
        console.log('✅ Admin upload succeeded');
        
        // Clean up test file
        await supabase.storage.from('documents').remove(['test-admin.txt']);
      }
    }

    console.log('\n=== Storage Policy Fix Complete ===');
    console.log('The key changes made:');
    console.log('- Changed from: auth.jwt() ->> \'role\' = \'admin\'');
    console.log('- Changed to: (auth.jwt() -> \'user_metadata\' ->> \'role\') = \'admin\'');
    console.log('- This matches how admin roles are actually stored in your JWT tokens');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the fix
fixStoragePoliciesComplete(); 