-- Drop any existing policies
DO $$
BEGIN
  -- Drop all policies on profiles
  EXECUTE (
    SELECT string_agg(format('DROP POLICY IF EXISTS %I ON %I', pol.polname, pol.tablename), '; ')
    FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'profiles'
  );
  
  -- Drop all policies on documents
  EXECUTE (
    SELECT string_agg(format('DROP POLICY IF EXISTS %I ON %I', pol.polname, pol.tablename), '; ')
    FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'documents'
  );
  
  -- Enable RLS
  EXECUTE 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE documents ENABLE ROW LEVEL SECURITY';
  
  -- Create a default deny all policy
  EXECUTE 'CREATE POLICY "Deny all operations by default" ON profiles USING (false)';
  EXECUTE 'CREATE POLICY "Deny all operations by default" ON documents USING (false)';
  
  -- Allow service role to bypass RLS
  EXECUTE 'ALTER TABLE profiles FORCE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE documents FORCE ROW LEVEL SECURITY';
  
  -- Allow service role to bypass RLS
  EXECUTE format('GRANT ALL ON profiles TO service_role');
  EXECUTE format('GRANT ALL ON documents TO service_role');
  
  RAISE NOTICE 'RLS has been reset and secured';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error resetting RLS: %', SQLERRM;
END;
$$;

-- Verify RLS is enabled
DO $$
DECLARE
  rls_enabled boolean;
BEGIN
  -- Check profiles table
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
  AND c.relname = 'profiles';
  
  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'RLS is not enabled on profiles table';
  END IF;
  
  -- Check documents table
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
  AND c.relname = 'documents';
  
  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'RLS is not enabled on documents table';
  END IF;
  
  RAISE NOTICE 'RLS verification passed';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error verifying RLS: %', SQLERRM;
  RAISE;
END;
$$;
