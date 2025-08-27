-- Update the accept_user_invitation function to set status to 'accepted'
-- This migration updates the existing function to set status to 'accepted' when accepting invitations

CREATE OR REPLACE FUNCTION accept_user_invitation(
  invitation_token TEXT,
  first_name TEXT,
  last_name TEXT,
  password TEXT
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
  -- Find the invitation
  SELECT * INTO invitation_record
  FROM user_invitations
  WHERE invitation_token = $1
    AND accepted_at IS NULL
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;
  
  -- Create the user account
  INSERT INTO auth.users (
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
  ) VALUES (
    invitation_record.email,
    crypt(password, gen_salt('bf')),
    NOW(),
    NOW(),
    NOW()
  ) RETURNING id INTO new_user_id;
  
  -- Create user profile
  PERFORM create_user_profile(
    new_user_id,
    first_name,
    last_name,
    invitation_record.role
  );
  
  -- Mark invitation as accepted
  UPDATE user_invitations
  SET accepted_at = NOW(),
      updated_at = NOW(),
      status = 'accepted'
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