-- Fix missing profile in production database
-- This script should be run against the production Supabase instance

-- First, check if the user exists in auth.users
SELECT 
  id,
  email,
  role,
  raw_user_meta_data,
  created_at
FROM auth.users 
WHERE id = '8e17fbc4-26b2-419b-ba15-5d61a05a69ae';

-- Check if profile exists
SELECT 
  id,
  email,
  full_name,
  role,
  is_active,
  created_at
FROM public.profiles 
WHERE id = '8e17fbc4-26b2-419b-ba15-5d61a05a69ae';

-- If user exists but profile doesn't, create the profile manually
-- (This is a fallback in case the trigger didn't work)
INSERT INTO public.profiles (
  id, 
  email, 
  full_name, 
  role, 
  is_active, 
  created_at, 
  updated_at
)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', ''),
  COALESCE(u.raw_user_meta_data->>'role', 'user'),
  true,
  u.created_at,
  u.updated_at
FROM auth.users u
WHERE u.id = '8e17fbc4-26b2-419b-ba15-5d61a05a69ae'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
  )
ON CONFLICT (id) DO NOTHING;

-- Verify the fix
SELECT 
  'User exists' as check_type,
  id,
  email,
  role
FROM auth.users 
WHERE id = '8e17fbc4-26b2-419b-ba15-5d61a05a69ae'

UNION ALL

SELECT 
  'Profile exists' as check_type,
  id,
  email,
  role
FROM public.profiles 
WHERE id = '8e17fbc4-26b2-419b-ba15-5d61a05a69ae';
