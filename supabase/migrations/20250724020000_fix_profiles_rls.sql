-- Fix RLS policies for profiles table to ensure proper access control

-- First, drop existing policies individually to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role has full access" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Deny all operations by default" ON public.profiles;

-- Also drop any other potential policies that might exist
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Drop any remaining policies on the profiles table
  FOR policy_record IN 
    SELECT polname 
    FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', policy_record.polname);
  END LOOP;
  
  RAISE NOTICE 'Dropped all existing policies on profiles table';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error dropping policies: %', SQLERRM;
END;
$$;

-- Recreate the policies in the correct order (most specific to least specific)

-- 1. Allow service role full access (most permissive, but most specific to service_role)
CREATE POLICY "Service role has full access"
ON public.profiles
FOR ALL
USING (auth.role() = 'service_role');

-- 2. Allow users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 3. Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Deny all other operations by default (must be last, most general)
CREATE POLICY "Deny all operations by default" 
ON public.profiles 
FOR ALL 
USING (false);

-- Verify the policies were created correctly
DO $$
DECLARE
  policy_count INTEGER;
  policy_names TEXT[] := ARRAY[
    'Service role has full access',
    'Users can view their own profile',
    'Users can update their own profile',
    'Deny all operations by default'
  ];
  policy_name TEXT;
  policy_exists BOOLEAN;
BEGIN
  -- Check total count
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'profiles' 
  AND schemaname = 'public';
  
  -- Check each expected policy exists
  FOREACH policy_name IN ARRAY policy_names LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'profiles' 
      AND schemaname = 'public' 
      AND policyname = policy_name
    ) INTO policy_exists;
    
    IF NOT policy_exists THEN
      RAISE EXCEPTION 'Policy "%" is missing from profiles table', policy_name;
    END IF;
  END LOOP;
  
  IF policy_count != array_length(policy_names, 1) THEN
    RAISE WARNING 'Unexpected number of policies found: % (expected %)', 
      policy_count, array_length(policy_names, 1);
  END IF;
  
  RAISE NOTICE 'Successfully verified % policies on profiles table', policy_count;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error verifying policies: %', SQLERRM;
  RAISE;
END;
$$;
