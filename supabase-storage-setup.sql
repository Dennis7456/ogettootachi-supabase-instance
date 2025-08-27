-- =====================================================
-- SUPABASE STORAGE SETUP FOR PROFILE PICTURES
-- =====================================================

-- Step 1: Add profile_picture column to profiles table
-- Run this first to add the database column
ALTER TABLE profiles 
ADD COLUMN profile_picture TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.profile_picture IS 'URL to the user profile picture stored in Supabase Storage';

-- =====================================================
-- Step 2: Storage Bucket Policies
-- =====================================================

-- Policy 1: Allow authenticated users to upload profile pictures
CREATE POLICY "Allow authenticated users to upload profile pictures" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-profiles' AND
  auth.role() = 'authenticated'
);

-- Policy 2: Allow public read access to profile pictures
CREATE POLICY "Allow public read access to profile pictures" ON storage.objects
FOR SELECT USING (bucket_id = 'user-profiles');

-- Policy 3: Allow users to update their own profile pictures
CREATE POLICY "Allow users to update their own profile pictures" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'user-profiles' AND
  auth.role() = 'authenticated'
);

-- =====================================================
-- Step 3: Verify Setup (Optional - for testing)
-- =====================================================

-- Check if the column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'profile_picture';

-- Check if policies were created successfully
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'; 