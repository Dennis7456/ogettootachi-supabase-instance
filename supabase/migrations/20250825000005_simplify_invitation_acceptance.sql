-- Simplify accept_user_invitation function to work with Supabase Auth
-- This function only handles invitation acceptance and profile creation

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
  current_user_id UUID;
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
  
  -- Get the current user's ID (should be created by Supabase Auth)
  current_user_id := auth.uid();
  
  -- If no current user, we need to create a profile for the invited email
  IF current_user_id IS NULL THEN
    -- Create a profile for the invited user (will be linked when they sign up)
    INSERT INTO profiles (
      id,
      full_name,
      role,
      email,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      p_first_name || ' ' || p_last_name,
      invitation_record.role,
      invitation_record.email,
      true,
      NOW(),
      NOW()
    );
  ELSE
    -- Update or create profile for the current user
    INSERT INTO profiles (
      id,
      full_name,
      role,
      email,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      current_user_id,
      p_first_name || ' ' || p_last_name,
      invitation_record.role,
      invitation_record.email,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      role = EXCLUDED.role,
      email = EXCLUDED.email,
      is_active = EXCLUDED.is_active,
      updated_at = NOW();
  END IF;
  
  -- Mark invitation as accepted
  UPDATE user_invitations
  SET accepted_at = NOW(),
      status = 'accepted',
      accepted_by = COALESCE(current_user_id, invitation_record.created_by)
  WHERE id = invitation_record.id;
  
  -- Return user details
  SELECT jsonb_build_object(
    'user_id', COALESCE(current_user_id, invitation_record.created_by),
    'email', invitation_record.email,
    'role', invitation_record.role,
    'message', 'Invitation accepted successfully'
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION accept_user_invitation(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_user_invitation(TEXT, TEXT, TEXT, TEXT) TO service_role;
