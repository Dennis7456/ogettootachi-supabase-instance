-- SQL script to fix missing profile for user 71b37539-336f-491c-9a10-b4c0d6e3ad7b
-- Run this in the Supabase SQL Editor

-- First, check if the user exists in auth.users
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data
FROM auth.users 
WHERE id = '71b37539-336f-491c-9a10-b4c0d6e3ad7b';

-- Check if profile already exists
SELECT * FROM profiles WHERE id = '71b37539-336f-491c-9a10-b4c0d6e3ad7b';

-- If the user exists but profile doesn't, create the profile
-- (Replace the values below with actual user data from the first query)
INSERT INTO profiles (
  id,
  full_name,
  role,
  is_active,
  created_at,
  updated_at
) 
SELECT 
  '71b37539-336f-491c-9a10-b4c0d6e3ad7b',
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'first_name',
    u.raw_user_meta_data->>'last_name',
    split_part(u.email, '@', 1)
  ) as full_name,
  COALESCE(u.raw_user_meta_data->>'role', 'admin') as role,
  true,
  NOW(),
  NOW()
FROM auth.users u
WHERE u.id = '71b37539-336f-491c-9a10-b4c0d6e3ad7b'
  AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = '71b37539-336f-491c-9a10-b4c0d6e3ad7b'
  );

-- Verify the profile was created
SELECT * FROM profiles WHERE id = '71b37539-336f-491c-9a10-b4c0d6e3ad7b'; 