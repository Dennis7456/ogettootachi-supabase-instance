-- Fix storage RLS policies for document uploads
-- This migration fixes the storage policies to allow admin uploads

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Documents are uploadable by admins" ON storage.objects;
DROP POLICY IF EXISTS "Documents are accessible by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Service role can access all storage" ON storage.objects;
DROP POLICY IF EXISTS "Documents are updatable by admins" ON storage.objects;
DROP POLICY IF EXISTS "Documents are deletable by admins" ON storage.objects;

-- Allow admins and service_role to upload to the documents bucket
CREATE POLICY "Documents are uploadable by admins" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role')
  );

-- Allow admins and service_role to update documents
CREATE POLICY "Documents are updatable by admins" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role')
  );

-- Allow admins and service_role to delete documents
CREATE POLICY "Documents are deletable by admins" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role')
  );

-- Allow authenticated users to read from the documents bucket
CREATE POLICY "Documents are accessible by authenticated users" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND auth.role() = 'authenticated'
  );

-- Allow service_role to do anything (for backend/Edge Function)
CREATE POLICY "Service role can access all storage" ON storage.objects
  FOR ALL USING (auth.role() = 'service_role'); 