-- Simple RLS fix for profiles table
-- Run this in the Supabase SQL Editor

-- First, check current state
SELECT 'Current profiles:' as status, COUNT(*) as count FROM public.profiles;

-- Check if our target profile exists
SELECT 'Target profile:' as status, id, email, full_name, role 
FROM public.profiles 
WHERE id = '8e17fbc4-26b2-419b-ba15-5d61a05a69ae';

-- Drop all existing policies
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
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;

-- Create simple, permissive policies
-- Allow any authenticated user to view any profile
CREATE POLICY "Allow authenticated users to view profiles" ON profiles 
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Allow users to update own profile" ON profiles 
FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Allow users to insert own profile" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role full access
CREATE POLICY "Allow service role full access" ON profiles 
FOR ALL USING (auth.role() = 'service_role');

-- Verify policies were created
SELECT 'Policies created:' as status, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Test the fix
SELECT 'Test query:' as status, id, email, full_name, role 
FROM public.profiles 
WHERE id = '8e17fbc4-26b2-419b-ba15-5d61a05a69ae';
