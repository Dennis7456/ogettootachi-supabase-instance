-- Check current RLS policies on profiles table
-- Run this in the Supabase SQL Editor

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- Check current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Test the current policies with a simple query
-- This should show us what's happening
SELECT 
  'Current policies test:' as status,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check if there are any restrictive policies that might be blocking access
SELECT 
  'Restrictive policies:' as status,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles' 
  AND (qual LIKE '%auth.uid%' OR qual LIKE '%auth.role%');
