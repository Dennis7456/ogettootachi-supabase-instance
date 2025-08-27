-- Check and fix RLS policies on profiles table
-- Run this in the Supabase SQL Editor

-- First, check current RLS policies
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
WHERE tablename = 'profiles';

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- Drop existing problematic policies and recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role full access" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON profiles;

-- Create new, more permissive policies
-- Allow authenticated users to view all profiles (needed for admin functionality)
CREATE POLICY "Authenticated users can view profiles" ON profiles 
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role full access
CREATE POLICY "Service role full access" ON profiles 
FOR ALL USING (auth.role() = 'service_role');

-- Test the policies by checking if we can now access the profile
-- This should work with anon key if the user is authenticated
SELECT 
  'Policy test:' as status,
  id,
  email,
  full_name,
  role
FROM public.profiles 
WHERE id = '8e17fbc4-26b2-419b-ba15-5d61a05a69ae';
