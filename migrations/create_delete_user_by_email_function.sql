-- Function to delete a user by email
CREATE OR REPLACE FUNCTION delete_user_by_email(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  success BOOLEAN := false;
BEGIN
  -- Find the user ID from the email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email;
  
  -- If user not found, return false
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Use the delete_user_safely function to delete the user
  RETURN delete_user_safely(v_user_id);
END;
$$; 