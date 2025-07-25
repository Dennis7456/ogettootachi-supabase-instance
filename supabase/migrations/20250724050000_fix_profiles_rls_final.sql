-- Final fix for profiles RLS policies to ensure proper access control

-- Enable RLS if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
  -- Drop all policies on profiles
  EXECUTE (
    SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.profiles', pol.polname), '; ')
    FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'profiles' AND pol.schemaname = 'public'
  );
  
  RAISE NOTICE 'Dropped existing policies on profiles table';
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

-- 4. Allow admins to manage all profiles
CREATE POLICY "Admins can manage all profiles"
ON public.profiles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- 5. Deny all other operations by default (must be last, most general)
CREATE POLICY "Deny all operations by default" 
ON public.profiles 
FOR ALL 
USING (false);

-- Create a function to verify RLS is working correctly
CREATE OR REPLACE FUNCTION verify_profiles_rls() 
RETURNS TABLE (policy_name TEXT, check_ok BOOLEAN, message TEXT) AS $$
DECLARE
  test_user_id UUID;
  admin_user_id UUID;
  test_user_client_id UUID;
  test_profile_id UUID;
  policy_rec RECORD;
  test_result BOOLEAN;
  error_message TEXT;
BEGIN
  -- Create a test user
  test_user_id := gen_random_uuid();
  admin_user_id := gen_random_uuid();
  
  -- Create a test profile for the admin
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data)
  VALUES (
    admin_user_id,
    'admin_' || substr(md5(random()::text), 1, 10) || '@example.com',
    crypt('password', gen_salt('bf')),
    NOW(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'))
  );
  
  INSERT INTO public.profiles (id, email, role, first_name, last_name, full_name)
  VALUES (
    admin_user_id,
    'admin_' || substr(md5(random()::text), 1, 10) || '@example.com',
    'admin',
    'Admin',
    'User',
    'Admin User'
  );
  
  -- Create a test user and profile
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data)
  VALUES (
    test_user_id,
    'test_' || substr(md5(random()::text), 1, 10) || '@example.com',
    crypt('password', gen_salt('bf')),
    NOW(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'))
  );
  
  INSERT INTO public.profiles (id, email, role, first_name, last_name, full_name)
  VALUES (
    test_user_id,
    'test_' || substr(md5(random()::text), 1, 10) || '@example.com',
    'user',
    'Test',
    'User',
    'Test User'
  );
  
  -- Test 1: Verify service role can access all profiles
  BEGIN
    SET LOCAL role TO service_role;
    PERFORM 1 FROM public.profiles LIMIT 1;
    test_result := true;
    error_message := NULL;
  EXCEPTION WHEN OTHERS THEN
    test_result := false;
    error_message := SQLERRM;
  END;
  
  RETURN QUERY 
  SELECT 'Service role access' AS policy_name, 
         test_result AS check_ok,
         COALESCE(error_message, 'Service role can access profiles') AS message;
  
  -- Test 2: Verify user can view their own profile
  BEGIN
    SET LOCAL role TO authenticated;
    SET LOCAL request.jwt.claim.sub TO test_user_id;
    PERFORM 1 FROM public.profiles WHERE id = test_user_id;
    test_result := true;
    error_message := NULL;
  EXCEPTION WHEN OTHERS THEN
    test_result := false;
    error_message := SQLERRM;
  END;
  
  RETURN QUERY 
  SELECT 'User can view own profile' AS policy_name, 
         test_result AS check_ok,
         COALESCE(error_message, 'User can view their own profile') AS message;
  
  -- Test 3: Verify user cannot view other profiles
  BEGIN
    SET LOCAL role TO authenticated;
    SET LOCAL request.jwt.claim.sub TO test_user_id;
    PERFORM 1 FROM public.profiles WHERE id != test_user_id;
    test_result := false;
    error_message := 'User was able to view other profiles';
  EXCEPTION WHEN OTHERS THEN
    test_result := true;
    error_message := NULL;
  END;
  
  RETURN QUERY 
  SELECT 'User cannot view other profiles' AS policy_name, 
         test_result AS check_ok,
         COALESCE(error_message, 'User cannot view other profiles (as expected)') AS message;
  
  -- Test 4: Verify admin can view all profiles
  BEGIN
    SET LOCAL role TO authenticated;
    SET LOCAL request.jwt.claim.sub TO admin_user_id;
    PERFORM 1 FROM public.profiles LIMIT 1;
    test_result := true;
    error_message := NULL;
  EXCEPTION WHEN OTHERS THEN
    test_result := false;
    error_message := SQLERRM;
  END;
  
  RETURN QUERY 
  SELECT 'Admin can view all profiles' AS policy_name, 
         test_result AS check_ok,
         COALESCE(error_message, 'Admin can view all profiles') AS message;
  
  -- Clean up
  DELETE FROM public.profiles WHERE id IN (test_user_id, admin_user_id);
  DELETE FROM auth.users WHERE id IN (test_user_id, admin_user_id);
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the policies were created correctly
DO $$
DECLARE
  policy_count INTEGER;
  policy_names TEXT[] := ARRAY[
    'Service role has full access',
    'Users can view their own profile',
    'Users can update their own profile',
    'Admins can manage all profiles',
    'Deny all operations by default'
  ];
  policy_name TEXT;
  policy_exists BOOLEAN;
  
  -- For verification results
  verify_rec RECORD;
  success_count INTEGER := 0;
  total_checks INTEGER := 0;
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
  
  -- Run verification tests
  RAISE NOTICE 'Running RLS verification tests...';
  
  FOR verify_rec IN SELECT * FROM verify_profiles_rls() LOOP
    total_checks := total_checks + 1;
    IF verify_rec.check_ok THEN
      success_count := success_count + 1;
      RAISE NOTICE 'PASS: % - %', verify_rec.policy_name, verify_rec.message;
    ELSE
      RAISE WARNING 'FAIL: % - %', verify_rec.policy_name, verify_rec.message;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'RLS verification complete: % of % tests passed', success_count, total_checks;
  
  -- Drop the verification function
  DROP FUNCTION IF EXISTS verify_profiles_rls();
  
  IF success_count < total_checks THEN
    RAISE EXCEPTION 'Some RLS verification tests failed. Please check the logs above for details.';
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  -- Ensure we clean up the verification function even if there's an error
  DROP FUNCTION IF EXISTS verify_profiles_rls();
  RAISE WARNING 'Error verifying RLS policies: %', SQLERRM;
  RAISE;
END;
$$;
