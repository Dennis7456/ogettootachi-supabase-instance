-- Fix storage RLS policies using Supabase's policy management
-- This migration fixes the storage policies to allow admin uploads

-- Drop all existing policies on storage.objects
DROP POLICY IF EXISTS "Allow admin uploads to documents" ON storage.objects;
DROP POLICY IF EXISTS "Documents are uploadable by admins" ON storage.objects;
DROP POLICY IF EXISTS "Documents are accessible by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Service role can access all storage" ON storage.objects;
DROP POLICY IF EXISTS "Documents are updatable by admins" ON storage.objects;
DROP POLICY IF EXISTS "Documents are deletable by admins" ON storage.objects;
DROP POLICY IF EXISTS "Public files are accessible by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Public files are uploadable by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Blog images are accessible by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Blog images are uploadable by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Blog images are updatable by authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Blog images are deletable by authenticated users" ON storage.objects;

-- Recreate policies in the correct order

-- Blog images policies
CREATE POLICY "Blog images are accessible by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'blog-images');

CREATE POLICY "Blog images are deletable by authenticated users" ON storage.objects
  FOR DELETE USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

CREATE POLICY "Blog images are updatable by authenticated users" ON storage.objects
  FOR UPDATE USING (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

CREATE POLICY "Blog images are uploadable by authenticated users" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'blog-images' AND auth.role() = 'authenticated');

-- Documents policies
CREATE POLICY "Documents are accessible by authenticated users" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Documents are deletable by admins" ON storage.objects
  FOR DELETE USING (
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

CREATE POLICY "Documents are uploadable by admins" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
      auth.role() = 'service_role'
    )
  );

-- Public files policies
CREATE POLICY "Public files are accessible by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'public');

CREATE POLICY "Public files are uploadable by authenticated users" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'public' AND auth.role() = 'authenticated');

-- Service role policy (must be last to avoid conflicts)
CREATE POLICY "Service role can access all storage" ON storage.objects
  FOR ALL USING (auth.role() = 'service_role'); 