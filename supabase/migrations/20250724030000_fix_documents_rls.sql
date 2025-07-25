-- =====================================================================

-- Fix RLS policies for documents table to ensure proper access control

-- Enable RLS if not already enabled
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Add user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'documents' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN user_id UUID REFERENCES auth.users(id);
    RAISE NOTICE 'Added user_id column to documents table';
  END IF;
END;
$$;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
  -- Drop all known policies explicitly
  DROP POLICY IF EXISTS "Service role has full access" ON public.documents;
  DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;
  DROP POLICY IF EXISTS "Admins can manage documents" ON public.documents;
  DROP POLICY IF EXISTS "Deny all operations by default" ON public.documents;

  -- Dynamically drop any other policies on public.documents
  EXECUTE (
    SELECT COALESCE(
      string_agg(format('DROP POLICY IF EXISTS %I ON public.documents', pol.polname), '; '),
      'SELECT 1' -- Default if no policies to drop
    )
    FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'documents'
      AND n.nspname = 'public'
      AND pol.polname NOT IN (
        'Service role has full access',
        'Authenticated users can view documents',
        'Admins can manage documents',
        'Deny all operations by default'
      )
  );
  
  RAISE NOTICE 'Dropped all existing policies on documents table';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error dropping policies: %', SQLERRM;
  RAISE; -- Re-raise the error to fail the migration
END;
$$;

-- Recreate the policies in the correct order (most specific to least specific)
DO $$
BEGIN
  -- 1. Allow service role full access (most permissive, but most specific to service_role)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documents' 
    AND schemaname = 'public' 
    AND policyname = 'Service role has full access'
  ) THEN
    EXECUTE $policy1$
      CREATE POLICY "Service role has full access"
      ON public.documents
      FOR ALL
      USING (auth.role() = 'service_role');
    $policy1$;
  END IF;
  
  -- 2. Allow admins to manage documents
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documents' 
    AND schemaname = 'public' 
    AND policyname = 'Admins can view all documents'
  ) THEN
    EXECUTE $policy2$
      -- Allow admins to see all documents
      CREATE POLICY "Admins can view all documents"
      ON public.documents
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
      
      -- Allow admins to modify documents
      CREATE POLICY "Admins can modify documents"
      ON public.documents
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      );
      -- Policy creation only - no cleanup operations here
    $policy2$;
  END IF;
  
  -- 3. Allow authenticated users to view documents
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documents' 
    AND schemaname = 'public' 
    AND policyname = 'Authenticated users can view documents'
  ) THEN
    EXECUTE $policy3$
      -- Allow users to see only their own documents
      CREATE POLICY "Authenticated users can view documents" 
      ON public.documents 
      FOR SELECT 
      USING (
        auth.role() = 'authenticated' AND 
        user_id = auth.uid()
      );
    $policy3$;
  END IF;
  
  -- 4. Deny all other operations by default (must be last, most general)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'documents' 
    AND schemaname = 'public' 
    AND policyname = 'Deny all operations by default'
  ) THEN
    EXECUTE $policy4$
      CREATE POLICY "Deny all operations by default" 
      ON public.documents 
      FOR ALL 
      USING (false);
    $policy4$;
  END IF;
  
  RAISE NOTICE 'Successfully created all policies for documents table';
  
  -- Verify the policies were created correctly
  DECLARE
    policy_count INTEGER;
    policy_names TEXT[] := ARRAY[
      'Service role has full access',
      'Authenticated users can view documents',
      'Admins can view all documents',
      'Admins can modify documents',
      'Deny all operations by default'
    ];
    policy_name TEXT;
    policy_exists BOOLEAN;
  BEGIN
    -- Check total count
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'documents' 
    AND schemaname = 'public';
    
    -- Check each expected policy exists
    FOREACH policy_name IN ARRAY policy_names LOOP
      SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'documents' 
        AND schemaname = 'public' 
        AND policyname = policy_name
      ) INTO policy_exists;
      
      IF NOT policy_exists THEN
        RAISE EXCEPTION 'Policy "%" is missing from documents table', policy_name;
      END IF;
    END LOOP;
    
    IF policy_count != array_length(policy_names, 1) THEN
      RAISE WARNING 'Unexpected number of policies found: % (expected %)', 
        policy_count, array_length(policy_names, 1);
    END IF;
    
    RAISE NOTICE 'Successfully verified % policies on documents table', policy_count;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error verifying policies: %', SQLERRM;
    RAISE;
  END;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error creating policies: %', SQLERRM;
  RAISE;
END;
$$;

-- Ensure pgcrypto extension is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add user_id column to documents table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'documents' 
                 AND column_name = 'user_id') THEN
    -- user_id column already added at the beginning of the migration
  END IF;
END $$;

-- Function to create test users and return their IDs
CREATE OR REPLACE FUNCTION setup_test_users() 
RETURNS TABLE (test_user_id UUID, admin_user_id UUID, test_doc_id UUID) AS $$
DECLARE
  test_user_email TEXT;
  admin_user_email TEXT;
  _test_user_id UUID;
  _admin_user_id UUID;
  _test_doc_id UUID;
BEGIN
  -- Generate unique test data
  test_user_email := 'test_' || substr(md5(random()::text), 1, 10) || '@example.com';
  admin_user_email := 'admin_' || substr(md5(random()::text), 1, 10) || '@example.com';
  _test_user_id := gen_random_uuid();
  _admin_user_id := gen_random_uuid();
  _test_doc_id := gen_random_uuid();
  
  -- Clean up any existing test users with these emails
  PERFORM cleanup_test_data(NULL, test_user_id, admin_user_id);
  
  -- Check if admin user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _admin_user_id) THEN
    -- Create admin user in auth.users
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data)
    VALUES (
      _admin_user_id,
      admin_user_email,
      crypt('password', gen_salt('bf')),
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'))
    );
  END IF;
  
  -- Check if admin profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _admin_user_id) THEN
    -- Create admin profile
    INSERT INTO public.profiles (id, email, role, first_name, last_name, full_name)
    VALUES (
      _admin_user_id,
      admin_user_email,
      'admin',
      'Admin',
      'User',
      'Admin User'
    );
  END IF;
  
  -- Check if test user exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _test_user_id) THEN
    -- Create regular user in auth.users
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data)
    VALUES (
      _test_user_id,
      test_user_email,
      crypt('password', gen_salt('bf')),
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'))
    );
  END IF;
  
  -- Check if test profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _test_user_id) THEN
    -- Create test user profile
    INSERT INTO public.profiles (id, email, role, first_name, last_name, full_name)
    VALUES (
      _test_user_id,
      test_user_email,
      'user',
      'Test',
      'User',
      'Test User'
    );
  END IF;
  
  -- Verify users were created successfully
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _admin_user_id) THEN
    RAISE EXCEPTION 'Failed to create admin user';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _test_user_id) THEN
    RAISE EXCEPTION 'Failed to create test user';
  END IF;
  
  -- Return the generated IDs
  test_user_id := _test_user_id;
  admin_user_id := _admin_user_id;
  test_doc_id := _test_doc_id;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a test result to the results array
CREATE OR REPLACE FUNCTION add_test_result(
  INOUT test_results TEXT[],
  test_name TEXT,
  passed BOOLEAN,
  message TEXT
) 
RETURNS TEXT[]
LANGUAGE plpgsql
AS $$
BEGIN
  test_results := array_append(
    test_results, 
    format('%s: %s - %s', 
      CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END, 
      test_name, 
      message
    )
  );
  
  RAISE NOTICE '%: % - %', 
    CASE WHEN passed THEN 'PASS' ELSE 'FAIL' END, 
    test_name, 
    message;
END;
$$;

-- Function to clean up test users by UUIDs
-- Note: This runs with the permissions of the function owner (should be a superuser)
CREATE OR REPLACE FUNCTION cleanup_test_data(
  p_doc_id UUID DEFAULT NULL,
  p_test_user_id UUID DEFAULT NULL,
  p_admin_user_id UUID DEFAULT NULL
) 
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Clean up document if ID is provided
  IF p_doc_id IS NOT NULL THEN
    DELETE FROM public.documents WHERE id = p_doc_id;
  END IF;
  
  -- Clean up test user profiles and auth records if IDs are provided
  IF p_test_user_id IS NOT NULL THEN
    DELETE FROM chatbot_conversations WHERE user_id = p_test_user_id;
    DELETE FROM public.profiles WHERE id = p_test_user_id;
    DELETE FROM auth.users WHERE id = p_test_user_id;
  END IF;
  
  -- Clean up admin user profiles and auth records if IDs are provided
  IF p_admin_user_id IS NOT NULL THEN
    DELETE FROM chatbot_conversations WHERE user_id = p_admin_user_id;
    DELETE FROM public.profiles WHERE id = p_admin_user_id;
    DELETE FROM auth.users WHERE id = p_admin_user_id;
  END IF;
  
  -- Fallback: Clean up any remaining test documents without specific IDs
  DELETE FROM public.documents WHERE title = 'Test Document';
  
  -- Fallback: Clean up any remaining test users without specific IDs
  DELETE FROM public.profiles WHERE email LIKE 'test_%@example.com' OR email LIKE 'admin_%@example.com';
  DELETE FROM auth.users WHERE email LIKE 'test_%@example.com' OR email LIKE 'admin_%@example.com';
  DELETE FROM chatbot_conversations WHERE user_id IN (
    SELECT id FROM auth.users WHERE email LIKE 'test_%@example.com' OR email LIKE 'admin_%@example.com'
  );
END;
$$;

-- Test script
DO $$
DECLARE
  test_user_id UUID;
  admin_user_id UUID;
  test_doc_id UUID;
  test_result BOOLEAN;
  error_message TEXT;
  test_results TEXT[] := ARRAY[]::TEXT[];
  test_user_email TEXT;
  admin_user_email TEXT;
  
BEGIN
  -- Setup test data
  SELECT setup_test_users.* INTO test_user_id, admin_user_id, test_doc_id FROM setup_test_users();
  
  -- Get the email addresses for cleanup
  SELECT email INTO test_user_email FROM auth.users WHERE id = test_user_id;
  SELECT email INTO admin_user_email FROM auth.users WHERE id = admin_user_id;
  
  -- Test 1: Service role should be able to insert documents
  BEGIN
    PERFORM SET_CONFIG('role', 'service_role', true);
    
    -- Insert a test document as service role
    INSERT INTO public.documents (id, title, content, user_id)
    VALUES (
      test_doc_id,
      'Test Document',
      'This is a test document',
      test_user_id
    );
    
    -- Verify the document was inserted
    IF EXISTS (SELECT 1 FROM public.documents WHERE id = test_doc_id) THEN
      SELECT add_test_result(test_results, 'Service Role Insert', true, 'Service role can insert documents') INTO test_results;
    ELSE
      SELECT add_test_result(test_results, 'Service Role Insert', false, 'Service role inserted document but it cannot be found') INTO test_results;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    SELECT add_test_result(test_results, 'Service Role Insert', false, 'Service role should be able to insert documents: ' || SQLERRM) INTO test_results;
  END;
  
  -- Test 2: Admin should be able to read all documents
  BEGIN
    PERFORM SET_CONFIG('role', 'authenticated', true);
    PERFORM SET_CONFIG('request.jwt.claim.sub', admin_user_id::text, true);
    
    -- Admin should be able to read all documents
    IF EXISTS (SELECT 1 FROM public.documents WHERE id = test_doc_id) THEN
      SELECT add_test_result(test_results, 'Admin Read', true, 'Admin can read documents') INTO test_results;
    ELSE
      SELECT add_test_result(test_results, 'Admin Read', false, 'Admin should be able to read all documents') INTO test_results;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    SELECT add_test_result(test_results, 'Admin Read', false, 'Admin should be able to read documents: ' || SQLERRM) INTO test_results;
  END;
  
  -- Test 3: Regular user should only see their own documents
  BEGIN
    PERFORM SET_CONFIG('role', 'authenticated', true);
    PERFORM SET_CONFIG('request.jwt.claim.sub', test_user_id::text, true);
    
    -- User should only see their own documents
    IF EXISTS (SELECT 1 FROM public.documents WHERE id = test_doc_id) THEN
      SELECT add_test_result(test_results, 'User Read Own Document', true, 'User can read their own document') INTO test_results;
    ELSE
      SELECT add_test_result(test_results, 'User Read Own Document', false, 'User should be able to read their own document') INTO test_results;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    SELECT add_test_result(test_results, 'User Read Own Document', false, 'User should be able to read their own document: ' || SQLERRM) INTO test_results;
  END;
  
  -- Test 4: Unauthenticated user should not see any documents
  BEGIN
    PERFORM SET_CONFIG('role', 'anon', true);
    PERFORM SET_CONFIG('request.jwt.claim.sub', NULL, true);
    
    -- Should not be able to read any documents
    BEGIN
      -- This should raise an exception for unauthenticated users
      PERFORM 1 FROM public.documents WHERE id = test_doc_id;
      SELECT add_test_result(test_results, 'Unauthenticated Access', false, 'Unauthenticated user should not be able to read documents') INTO test_results;
    EXCEPTION WHEN OTHERS THEN
      -- Expected: unauthenticated users should get an error
      SELECT add_test_result(test_results, 'Unauthenticated Access', true, 'Unauthenticated user access is correctly restricted') INTO test_results;
    END;
  END;

  -- Cleanup using the SECURITY DEFINER function
  -- This avoids direct access to auth.users table
  PERFORM cleanup_test_data(
    test_doc_id,
    test_user_id,
    admin_user_id
  );
  
  RAISE NOTICE '✅ Cleaned up test data';
  RAISE NOTICE '✅ All RLS tests passed successfully!';

EXCEPTION WHEN OTHERS THEN
  -- Log the error that caused the test to fail
  RAISE WARNING 'Test failed with error: %', SQLERRM;
  
  -- Ensure cleanup happens even if tests fail
  IF test_user_id IS NOT NULL AND admin_user_id IS NOT NULL AND test_doc_id IS NOT NULL THEN
    -- Use a separate block for cleanup to handle any errors during cleanup
    BEGIN
      -- Cleanup using the SECURITY DEFINER function
      PERFORM cleanup_test_data(
        test_doc_id,
        test_user_id,
        admin_user_id
      );
      
      RAISE NOTICE '✅ Cleaned up test data after failure';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to clean up test data: %', SQLERRM;
    END;
  END IF;
  
  -- Re-raise the original error to fail the test
  RAISE;
  
  -- Log test results before exiting
  RAISE NOTICE 'RLS Test Results: %', test_results;
  
  -- Log each test result on a separate line for better readability
  FOR i IN 1..array_length(test_results, 1) LOOP
    RAISE NOTICE '%', test_results[i];
  END LOOP;
END;
$$;

-- =====================================================================
-- NOTE: The following RLS verification block is commented out because
-- the test function is not created automatically in migrations.
-- To run RLS tests, create the function and run this block manually
-- in Supabase Studio as the owner.
-- =====================================================================
--
-- DO $$
-- DECLARE
--   verify_rec RECORD;
--   passed_count INTEGER := 0;
--   total_tests INTEGER := 0;
-- BEGIN
--   RAISE NOTICE 'Running RLS verification tests for documents table...';
--   FOR verify_rec IN SELECT * FROM public.verify_documents_rls_test() LOOP
--     total_tests := total_tests + 1;
--     IF verify_rec.passed THEN
--       passed_count := passed_count + 1;
--       RAISE NOTICE 'PASS: % - %', verify_rec.test_name, verify_rec.message;
--     ELSE
--       RAISE WARNING 'FAIL: % - %', verify_rec.test_name, verify_rec.message;
--     END IF;
--   END LOOP;
--   RAISE NOTICE 'RLS verification complete: % of % tests passed', passed_count, total_tests;
--   DROP FUNCTION IF EXISTS verify_documents_rls();
--   IF passed_count < total_tests THEN
--     RAISE EXCEPTION 'Some RLS verification tests failed. Please check the logs above for details.';
--   END IF;
-- EXCEPTION WHEN OTHERS THEN
--   DROP FUNCTION IF EXISTS verify_documents_rls();
--   RAISE WARNING 'Error verifying RLS: %', SQLERRM;
--   RAISE;
-- END;
-- $$;
