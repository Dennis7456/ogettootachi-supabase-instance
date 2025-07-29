-- Function to create a user invitation
CREATE OR REPLACE FUNCTION create_user_invitation(
  invite_email TEXT,
  user_role TEXT DEFAULT 'staff',
  expires_in_hours INTEGER DEFAULT 72
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_id UUID;
  invitation_token TEXT;
  expiry_time TIMESTAMPTZ;
  result JSONB;
BEGIN
  -- Generate a random token
  invitation_token := encode(gen_random_bytes(24), 'hex');
  
  -- Calculate expiry time
  expiry_time := NOW() + (expires_in_hours * INTERVAL '1 hour');
  
  -- Insert the invitation
  INSERT INTO user_invitations (
    email,
    role,
    invitation_token,
    expires_at,
    created_by
  ) VALUES (
    invite_email,
    user_role,
    invitation_token,
    expiry_time,
    auth.uid()
  )
  RETURNING id INTO invitation_id;
  
  -- Return the invitation details
  result := jsonb_build_object(
    'id', invitation_id,
    'email', invite_email,
    'token', invitation_token,
    'role', user_role,
    'expires_at', expiry_time
  );
  
  RETURN result;
END;
$$;

-- Function to accept a user invitation
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
  user_id UUID;
  result JSONB;
BEGIN
  -- Find the invitation
  SELECT * INTO invitation_record
  FROM user_invitations
  WHERE invitation_token = accept_user_invitation.invitation_token
  AND used_at IS NULL
  AND expires_at > NOW();
  
  -- Check if invitation exists and is valid
  IF invitation_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid or expired invitation token'
    );
  END IF;
  
  -- Create the user
  user_id := auth.uid();
  
  -- Mark invitation as used
  UPDATE user_invitations
  SET used_at = NOW(),
      accepted_by = user_id
  WHERE id = invitation_record.id;
  
  -- Create profile for the user
  INSERT INTO profiles (
    id,
    full_name,
    role,
    email,
    is_active
  ) VALUES (
    user_id,
    first_name || ' ' || last_name,
    invitation_record.role,
    invitation_record.email,
    true
  );
  
  -- Return success
  result := jsonb_build_object(
    'success', true,
    'message', 'Invitation accepted successfully',
    'user_id', user_id,
    'role', invitation_record.role
  );
  
  RETURN result;
END;
$$;

-- Function to get pending invitations
CREATE OR REPLACE FUNCTION get_pending_invitations()
RETURNS SETOF user_invitations
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admin users can view pending invitations';
  END IF;
  
  -- Return pending invitations
  RETURN QUERY
  SELECT *
  FROM user_invitations
  WHERE used_at IS NULL
  AND expires_at > NOW()
  ORDER BY created_at DESC;
END;
$$;

-- Function to cancel an invitation
CREATE OR REPLACE FUNCTION cancel_invitation(
  invitation_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admin users can cancel invitations';
  END IF;
  
  -- Find the invitation
  SELECT * INTO invitation_record
  FROM user_invitations
  WHERE id = invitation_id
  AND used_at IS NULL;
  
  -- Check if invitation exists
  IF invitation_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invitation not found or already used'
    );
  END IF;
  
  -- Delete the invitation
  DELETE FROM user_invitations
  WHERE id = invitation_id;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Invitation cancelled successfully'
  );
END;
$$; 