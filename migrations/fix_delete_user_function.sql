-- Drop the existing function
DROP FUNCTION IF EXISTS delete_user_safely(UUID);

-- Function to safely delete a user and all related records
CREATE OR REPLACE FUNCTION delete_user_safely(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  success BOOLEAN := false;
BEGIN
  -- Delete records from tables with foreign keys to auth.users
  
  -- 1. Delete from analytics_conversions
  DELETE FROM analytics_conversions WHERE user_id = p_user_id;
  
  -- 2. Delete from analytics_pageviews
  DELETE FROM analytics_pageviews WHERE user_id = p_user_id;
  
  -- 3. Update appointments to remove assignment
  UPDATE appointments SET assigned_to = NULL WHERE assigned_to = p_user_id;
  
  -- 4. Delete from profiles
  DELETE FROM profiles WHERE id = p_user_id;
  
  -- 5. Update user_invitations to remove references
  UPDATE user_invitations SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE user_invitations SET accepted_by = NULL WHERE accepted_by = p_user_id;
  
  -- 6. Delete the user from auth.users (this will cascade to auth.identities, auth.mfa_factors, auth.sessions, and auth.one_time_tokens)
  DELETE FROM auth.users WHERE id = p_user_id;
  
  -- Check if user was deleted successfully
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    success := true;
  END IF;
  
  RETURN success;
END;
$$; 