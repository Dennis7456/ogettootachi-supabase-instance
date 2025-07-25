-- Create a function to check if RLS is enabled on a table
CREATE OR REPLACE FUNCTION is_rls_enabled(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rls_enabled boolean;
BEGIN
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
  AND c.relname = table_name
  AND c.relkind = 'r';
  
  RETURN rls_enabled;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_rls_enabled(text) TO anon, authenticated, service_role;

-- Enable RLS on profiles and documents tables if not already enabled
DO $$
BEGIN
  -- Enable RLS on profiles
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', 'profiles');
  
  -- Enable RLS on documents
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', 'documents');
  
  -- Create a policy that denies all operations by default
  -- This ensures that no operations are allowed unless explicitly permitted by other policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles' 
    AND policyname = 'deny_all_policy'
  ) THEN
    EXECUTE format('CREATE POLICY deny_all_policy ON %I USING (false)', 'profiles');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'documents' 
    AND policyname = 'deny_all_policy'
  ) THEN
    EXECUTE format('CREATE POLICY deny_all_policy ON %I USING (false)', 'documents');
  END IF;
  
  RAISE NOTICE 'RLS has been enabled and secured on profiles and documents tables';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error setting up RLS: %', SQLERRM;
END;
$$;
