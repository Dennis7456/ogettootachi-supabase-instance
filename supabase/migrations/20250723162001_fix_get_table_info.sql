-- Drop existing function if it has issues
DROP FUNCTION IF EXISTS public.get_table_info;

-- Recreate the function with explicit schema qualification
CREATE OR REPLACE FUNCTION public.get_table_info(p_table_name TEXT)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = p_table_name
  ) INTO v_exists;

  RETURN json_build_object(
    'table', p_table_name,
    'exists', v_exists
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_table_info(TEXT) TO anon, authenticated, service_role;

-- Test the function
DO $$
DECLARE
  v_result JSON;
BEGIN
  v_result := public.get_table_info('profiles');
  RAISE NOTICE 'Test get_table_info: %', v_result::TEXT;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error testing get_table_info: %', SQLERRM;
END;
$$;
