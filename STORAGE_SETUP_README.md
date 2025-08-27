# Supabase Storage Setup for Profile Pictures

This guide will help you set up the complete storage infrastructure for profile pictures in your law firm website.

## Prerequisites

- Supabase project created
- Access to Supabase Dashboard
- `user-profiles` bucket already created (you've done this)

## Step-by-Step Setup

### 1. Database Schema Update

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor** (in the left sidebar)
3. **Copy and paste the following SQL commands:**

```sql
-- Add profile_picture column to profiles table
ALTER TABLE profiles 
ADD COLUMN profile_picture TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.profile_picture IS 'URL to the user profile picture stored in Supabase Storage';
```

4. **Click "Run" to execute the commands**

### 2. Storage Bucket Policies

1. **In the same SQL Editor**, run these policy commands:

```sql
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
```

### 3. Verify Setup

Run these verification queries to ensure everything is set up correctly:

```sql
-- Check if the column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'profile_picture';

-- Check if policies were created successfully
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

## What Each Policy Does

### INSERT Policy
- **Purpose**: Allows authenticated users to upload profile pictures
- **Scope**: Only applies to the `user-profiles` bucket
- **Security**: Only authenticated users can upload

### SELECT Policy
- **Purpose**: Allows public read access to profile pictures
- **Scope**: Anyone can view the images (needed for team page display)
- **Security**: Public access for viewing profile pictures

### UPDATE Policy
- **Purpose**: Allows authenticated users to update their profile pictures
- **Scope**: Only applies to the `user-profiles` bucket
- **Security**: Only authenticated users can update

## Testing the Setup

1. **Go to your application**
2. **Navigate to User Management**
3. **Click "Invite User"**
4. **Try uploading a profile picture**
5. **The upload should work without errors**

## Troubleshooting

### Common Issues

1. **"Bucket not found" error**
   - Ensure the bucket name is exactly `user-profiles`
   - Check that the bucket is created in the correct project

2. **"Policy already exists" error**
   - This is normal if policies were already created
   - You can safely ignore this error

3. **Upload fails with 403 error**
   - Check that all three policies are created
   - Verify the user is authenticated

4. **Images not displaying**
   - Ensure the bucket is set to "Public"
   - Check that the SELECT policy is created

### Verification Commands

```sql
-- Check bucket exists
SELECT * FROM storage.buckets WHERE id = 'user-profiles';

-- Check policies exist
SELECT policyname FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Check column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'profile_picture';
```

## File Structure

```
supabase-storage-setup.sql  # Complete SQL setup file
STORAGE_SETUP_README.md     # This documentation
```

## Next Steps

After completing this setup:

1. Test the profile picture upload in your application
2. Verify images display correctly on the team page
3. Test the update functionality for existing profile pictures

## Support

If you encounter any issues:

1. Check the Supabase logs in the Dashboard
2. Verify all policies are created correctly
3. Ensure the bucket is configured as public
4. Test with a simple image file first 