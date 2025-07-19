-- Remove email column from profiles table

-- Drop the email column if it exists
ALTER TABLE profiles DROP COLUMN IF EXISTS email;

-- Update the manual profile creation function
CREATE OR REPLACE FUNCTION create_user_profile(user_id UUID, full_name TEXT DEFAULT '', role TEXT DEFAULT 'user')
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if profile already exists
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
    RAISE NOTICE 'Profile already exists for user ID: %', user_id;
    RETURN TRUE;
  END IF;
  
  -- Insert new profile
  INSERT INTO profiles (id, full_name, role, is_active)
  VALUES (user_id, full_name, role, true);
  
  RAISE NOTICE 'Profile created for user ID: %', user_id;
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', user_id, SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile(UUID, TEXT, TEXT) TO anon; 