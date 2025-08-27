-- Comprehensive RLS fix for profiles table
-- Run this in the Supabase SQL Editor

-- First, let's see what we're working with
SELECT 'Current state:' as status, COUNT(*) as total_profiles FROM public.profiles;

-- Check if our target profile exists
SELECT 'Target profile check:' as status, id, email, full_name, role 
FROM public.profiles 
WHERE id = '8e17fbc4-26b2-419b-ba15-5d61a05a69ae';

-- Check current RLS policies
SELECT 'Current policies:' as status, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role full access" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can update profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON profiles;

-- Create new, simple policies that work
-- Policy 1: Allow authenticated users to view all profiles
CREATE POLICY "Authenticated users can view all profiles" ON profiles 
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 2: Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE USING (auth.uid() = id);

-- Policy 3: Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 4: Allow service role full access
CREATE POLICY "Service role full access" ON profiles 
FOR ALL USING (auth.role() = 'service_role');

-- Verify the new policies
SELECT 'New policies created:' as status, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

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
