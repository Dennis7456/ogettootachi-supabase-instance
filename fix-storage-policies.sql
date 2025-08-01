-- Fix existing storage policies
-- First, drop the existing policies that have issues

-- Drop the existing policies
DROP POLICY IF EXISTS "Authenticated users can upload their profile pic 1skn4k9_0" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload their profile pic 1skn4k9_1" ON storage.objects;
DROP POLICY IF EXISTS "Public can read 1skn4k9_0" ON storage.objects;

-- Now create the correct policies

-- 1. INSERT policy (this one was correct, but let's recreate it with a better name)
CREATE POLICY "Authenticated users can upload their profile picture"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- 2. UPDATE policy (this one was missing WITH CHECK clause)
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

-- 3. DELETE policy (this was missing entirely)
CREATE POLICY "Authenticated users can delete their profile picture"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND auth.uid()::text = split_part(name, '/', 1)
);

-- 4. SELECT policy for public (this one was correct, but let's recreate it with a better name)
CREATE POLICY "Public can read profile pictures"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'profile-pictures');

-- 5. SELECT policy for authenticated users (this was missing)
CREATE POLICY "Authenticated users can read profile pictures"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'profile-pictures'); 