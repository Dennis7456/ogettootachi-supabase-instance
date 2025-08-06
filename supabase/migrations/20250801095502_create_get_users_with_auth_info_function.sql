-- Create a function to safely get users with auth information
-- This function has SECURITY DEFINER which allows it to access auth.users table
CREATE OR REPLACE FUNCTION get_users_with_auth_info()
RETURNS TABLE (
  id uuid,
  full_name text,
  role text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  email character varying,
  email_confirmed_at timestamptz,
  last_sign_in_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.role,
    p.is_active,
    p.created_at,
    p.updated_at,
    u.email,
    u.email_confirmed_at,
    u.last_sign_in_at
  FROM profiles p
  LEFT JOIN auth.users u ON p.id = u.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_users_with_auth_info() TO authenticated; 