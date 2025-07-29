-- Function to check if any admin user exists
CREATE OR REPLACE FUNCTION check_admin_exists()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Check if any user with role 'admin' exists in the profiles table
  SELECT COUNT(*) INTO admin_count
  FROM profiles
  WHERE role = 'admin';
  
  -- Return true if at least one admin exists, false otherwise
  RETURN admin_count > 0;
END;
$$; 