import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixStoragePolicies() {
  console.log('=== Fixing Storage Policies ===\n');

  try {
    // First, let's check what policies currently exist
    console.log('Checking existing storage policies...');
    
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.policies')
      .select('*')
      .eq('table_schema', 'storage')
      .eq('table_name', 'objects');

    if (policiesError) {
      console.log('Could not check existing policies:', policiesError.message);
    } else {
      console.log('Existing policies:', policies?.map(p => p.policy_name) || []);
    }

    // Let's try a different approach - use the storage API to test upload
    console.log('\nTesting storage access...');
    
    const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload('test-file.txt', testFile);

    if (uploadError) {
      console.log('❌ Upload test failed:', uploadError.message);
      
      // If upload fails, let's try to create a simple policy
      console.log('\nAttempting to create a simple upload policy...');
      
      // We'll need to use a different approach since we can't execute SQL directly
      console.log('Please run the following SQL in the Supabase SQL Editor:');
      console.log(`
-- Drop existing policies
DROP POLICY IF EXISTS "Documents are uploadable by admins" ON storage.objects;
DROP POLICY IF EXISTS "Documents are accessible by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Service role can access all storage" ON storage.objects;

-- Create simple policies
CREATE POLICY "Documents are uploadable by admins" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role')
  );

CREATE POLICY "Documents are accessible by authenticated users" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Service role can access all storage" ON storage.objects
  FOR ALL USING (auth.role() = 'service_role');
      `);
      
    } else {
      console.log('✅ Upload test succeeded!');
      
      // Clean up test file
      await supabase.storage
        .from('documents')
        .remove(['test-file.txt']);
      
      console.log('✅ Storage policies are working correctly!');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

fixStoragePolicies(); 