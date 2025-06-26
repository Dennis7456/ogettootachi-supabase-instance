-- Helper function to check if vector extension is enabled
CREATE OR REPLACE FUNCTION check_vector_extension()
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  );
END;
$$;

-- Helper function to check if RLS is enabled on a table
CREATE OR REPLACE FUNCTION check_rls_enabled(table_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE tablename = table_name 
    AND rowsecurity = true
  );
END;
$$;

-- Grant execute permissions on helper functions
GRANT EXECUTE ON FUNCTION check_vector_extension() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_rls_enabled(TEXT) TO anon, authenticated; 