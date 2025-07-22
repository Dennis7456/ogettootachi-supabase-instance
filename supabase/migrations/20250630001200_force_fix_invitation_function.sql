-- Force fix for create_user_invitation function
-- Enhanced token generation with improved uniqueness and security

DROP FUNCTION IF EXISTS create_user_invitation(TEXT, TEXT, INTEGER);

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
  current_user_id UUID;
  v_invitation_token TEXT;
  v_invitation_id UUID;
  v_result JSONB;
  v_token_attempts INTEGER := 0;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = current_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can create invitations';
  END IF;
  
  -- Check if email already has an invitation
  IF EXISTS (
    SELECT 1 FROM user_invitations 
    WHERE email = invite_email AND accepted_at IS NULL AND expires_at > NOW()
  ) THEN
    RAISE EXCEPTION 'User already has a pending invitation';
  END IF;
  
  -- Check if user already exists
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE email = invite_email
  ) THEN
    RAISE EXCEPTION 'User already exists';
  END IF;
  
  -- Generate unique invitation token with multiple attempts
  LOOP
    -- Increment attempts
    v_token_attempts := v_token_attempts + 1;
    
    -- Generate token using cryptographically secure method
    v_invitation_token := encode(gen_random_bytes(32), 'hex') || 
                          '-' || to_char(NOW(), 'YYYYMMDDHH24MISS') || 
                          '-' || md5(random()::text);
    
    -- Check for token uniqueness
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM user_invitations 
      WHERE invitation_token = v_invitation_token
    );
    
    -- Prevent infinite loop
    IF v_token_attempts > 10 THEN
      RAISE EXCEPTION 'Failed to generate unique invitation token after 10 attempts';
    END IF;
  END LOOP;
  
  -- Create invitation
  INSERT INTO user_invitations (
    email, 
    invited_by, 
    role, 
    invitation_token, 
    expires_at
  ) VALUES (
    invite_email,
    current_user_id,
    user_role,
    v_invitation_token,
    NOW() + (expires_in_hours || ' hours')::INTERVAL
  ) RETURNING id INTO v_invitation_id;
  
  -- Return invitation details - use variable and qualified column references
  SELECT jsonb_build_object(
    'id', v_invitation_id,
    'email', invite_email,
    'role', user_role,
    'invitation_token', v_invitation_token,
    'expires_at', ui.expires_at,
    'invitation_url', 'http://127.0.0.1:5173/admin/invite?token=' || v_invitation_token
  ) INTO v_result
  FROM user_invitations ui
  WHERE ui.id = v_invitation_id;
  
  RETURN v_result;
END;
$$; 