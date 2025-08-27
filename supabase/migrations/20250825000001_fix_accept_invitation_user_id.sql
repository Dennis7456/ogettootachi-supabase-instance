-- Fix the accept_user_invitation function to properly generate user ID
-- This migration fixes the null value in column "id" error

DROP FUNCTION IF EXISTS accept_user_invitation(TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION accept_user_invitation(
  p_invitation_token TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
  new_user_id UUID;
  result JSONB;
BEGIN
  -- Find the invitation using parameter name to avoid ambiguity
  SELECT * INTO invitation_record
  FROM user_invitations
  WHERE invitation_token = p_invitation_token
    AND accepted_at IS NULL
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;
  
  -- Generate a new UUID for the user
  new_user_id := gen_random_uuid();
  
  -- Create the user account with explicit ID
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    invitation_record.email,
    crypt(p_password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  );
  
  -- Create user profile
  INSERT INTO profiles (
    id,
    full_name,
    role,
    email,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    p_first_name || ' ' || p_last_name,
    invitation_record.role,
    invitation_record.email,
    true,
    NOW(),
    NOW()
  );
  
  -- Mark invitation as accepted
  UPDATE user_invitations
  SET accepted_at = NOW(),
      updated_at = NOW(),
      status = 'accepted',
      accepted_by = new_user_id
  WHERE id = invitation_record.id;
  
  -- Return user details
  SELECT jsonb_build_object(
    'user_id', new_user_id,
    'email', invitation_record.email,
    'role', invitation_record.role,
    'message', 'User account created successfully'
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION accept_user_invitation(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_user_invitation(TEXT, TEXT, TEXT, TEXT) TO service_role;
