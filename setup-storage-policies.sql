-- Storage Policies for profile-pictures bucket
-- Run these one by one in the Supabase SQL Editor

-- 1. Allow authenticated users to upload their own profile picture
CREATE POLICY "Authenticated users can upload their profile picture"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- 2. Allow authenticated users to update their own profile picture
CREATE POLICY "Authenticated users can update their profile picture"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND auth.uid()::text = split_part(name, '/', 1)
)
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- 3. Allow authenticated users to delete their own profile picture
CREATE POLICY "Authenticated users can delete their profile picture"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- 4. Allow public read access to profile pictures
CREATE POLICY "Public can read profile pictures"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'profile-pictures');

-- 5. Also allow authenticated users to read profile pictures
CREATE POLICY "Authenticated users can read profile pictures"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'profile-pictures'); 