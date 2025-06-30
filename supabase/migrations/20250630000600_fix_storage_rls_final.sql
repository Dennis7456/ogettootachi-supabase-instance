-- Fix storage RLS policies to check user_metadata for admin role
-- This migration fixes the storage policies to allow admin uploads

-- Drop existing policies if they exist
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