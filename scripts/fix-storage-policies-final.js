import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixStoragePoliciesFinal() {
  console.log('=== Fixing Storage Policies (Final) ===\n');

  console.log('The issue is that the admin role is in user_metadata, not in the main JWT role field.');
  console.log('Please run the following SQL in the Supabase SQL Editor:\n');

  console.log(`
-- Drop existing policies
DROP POLICY IF EXISTS "Documents are uploadable by admins" ON storage.objects;
DROP POLICY IF EXISTS "Documents are accessible by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Service role can access all storage" ON storage.objects;
DROP POLICY IF EXISTS "Documents are updatable by admins" ON storage.objects;
DROP POLICY IF EXISTS "Documents are deletable by admins" ON storage.objects;

-- Create policies that check user_metadata for admin role
CREATE POLICY "Documents are uploadable by admins" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
      auth.role() = 'service_role'
    )
  );

CREATE POLICY "Documents are updatable by admins" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND 
    (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
      auth.role() = 'service_role'
    )
  );

CREATE POLICY "Documents are deletable by admins" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND 
    (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
      auth.role() = 'service_role'
    )
  );

CREATE POLICY "Documents are accessible by authenticated users" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND auth.role() = 'authenticated'
  );

CREATE POLICY "Service role can access all storage" ON storage.objects
  FOR ALL USING (auth.role() = 'service_role');
  `);

  console.log('\nAfter running this SQL, try uploading a document again.');
  console.log('The key change is using: (auth.jwt() -> \'user_metadata\' ->> \'role\') = \'admin\'');
  console.log('Instead of: auth.jwt() ->> \'role\' = \'admin\'');
}

fixStoragePoliciesFinal(); 