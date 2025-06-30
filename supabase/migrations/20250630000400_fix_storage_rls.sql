-- Fix storage RLS policies for document uploads
-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Documents are accessible by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Documents are uploadable by admins" ON storage.objects;
DROP POLICY IF EXISTS "Documents are updatable by admins" ON storage.objects;
DROP POLICY IF EXISTS "Documents are deletable by admins" ON storage.objects;
DROP POLICY IF EXISTS "Public files are accessible by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Public files are uploadable by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Service role can access all storage" ON storage.objects;

-- Create new storage policies for documents bucket
CREATE POLICY "Documents are accessible by authenticated users" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Documents are uploadable by admins" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role')
  );

CREATE POLICY "Documents are updatable by admins" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role')
  );

CREATE POLICY "Documents are deletable by admins" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND 
    (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role')
  );

-- Create storage policies for public bucket
CREATE POLICY "Public files are accessible by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'public');

CREATE POLICY "Public files are uploadable by authenticated users" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'public' AND auth.role() = 'authenticated');

-- Add explicit service role policies for storage
CREATE POLICY "Service role can access all storage" ON storage.objects
  FOR ALL USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT ALL ON storage.objects TO service_role;
GRANT ALL ON storage.buckets TO service_role; 