-- Update accept_user_invitation to handle existing auth users and upsert profile
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
  existing_user RECORD;
  target_user_id UUID;
  result JSONB;
BEGIN
  -- Locate valid invitation
  SELECT * INTO invitation_record
  FROM user_invitations
  WHERE invitation_token = p_invitation_token
    AND accepted_at IS NULL
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation token';
  END IF;

  -- Check if auth user already exists (created earlier by admin flow)
  SELECT * INTO existing_user
  FROM auth.users
  WHERE email = invitation_record.email;

  IF FOUND THEN
    -- Update existing user's password and confirm email
    UPDATE auth.users
    SET encrypted_password = crypt(p_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = existing_user.id;

    target_user_id := existing_user.id;
  ELSE
    -- Create new user if not present
    INSERT INTO auth.users (
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at
    ) VALUES (
      invitation_record.email,
      crypt(p_password, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW()
    ) RETURNING id INTO target_user_id;
  END IF;

  -- Upsert profile to avoid conflicts with auth trigger
  INSERT INTO profiles (
    id, full_name, role, email, is_active, created_at, updated_at
  ) VALUES (
    target_user_id,
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
    is_active = true,
    updated_at = NOW();

  -- Mark invitation as accepted
  UPDATE user_invitations
  SET accepted_at = NOW(),
      status = 'accepted',
      accepted_by = target_user_id
  WHERE id = invitation_record.id;

  -- Return details
  SELECT jsonb_build_object(
    'user_id', target_user_id,
    'email', invitation_record.email,
    'role', invitation_record.role,
    'message', 'Invitation accepted successfully'
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_user_invitation(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_user_invitation(TEXT, TEXT, TEXT, TEXT) TO service_role;


