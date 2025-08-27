-- Simple fix for missing profile in production
-- Run this in the Supabase SQL Editor

-- Check if user exists
SELECT 'User check:' as status, id, email FROM auth.users WHERE id = '8e17fbc4-26b2-419b-ba15-5d61a05a69ae';

-- Check if profile exists
SELECT 'Profile check:' as status, id, email, full_name, role FROM public.profiles WHERE id = '8e17fbc4-26b2-419b-ba15-5d61a05a69ae';

-- Create profile if user exists but profile doesn't
INSERT INTO public.profiles (id, email, full_name, role, is_active, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', 'Dennis Kiplangat'),
  COALESCE(u.raw_user_meta_data->>'role', 'admin'),
  true,
  u.created_at,
  u.updated_at
FROM auth.users u
WHERE u.id = '8e17fbc4-26b2-419b-ba15-5d61a05a69ae'
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Verify the fix
SELECT 'Final check:' as status, id, email, full_name, role FROM public.profiles WHERE id = '8e17fbc4-26b2-419b-ba15-5d61a05a69ae';
