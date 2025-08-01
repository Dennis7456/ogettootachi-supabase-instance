-- Create the check_admin_exists function
CREATE OR REPLACE FUNCTION public.check_admin_exists()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
$function$; 