-- Fix the get_pending_invitations function
CREATE OR REPLACE FUNCTION get_pending_invitations()
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  invited_by_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can view invitations';
  END IF;
  
  RETURN QUERY
  SELECT 
    ui.id,
    ui.email,
    ui.role,
    u.email as invited_by_email,
    ui.created_at,
    ui.expires_at
  FROM user_invitations ui
  JOIN auth.users u ON ui.invited_by = u.id
  WHERE ui.accepted_at IS NULL
    AND ui.expires_at > NOW()
  ORDER BY ui.created_at DESC;
END;
$$;

-- Fix the cancel_invitation function
CREATE OR REPLACE FUNCTION cancel_invitation(invitation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can cancel invitations';
  END IF;
  
  -- Delete the invitation
  DELETE FROM user_invitations
  WHERE id = invitation_id
    AND accepted_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Fix the create_user_invitation function
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
  invitation_token TEXT;
  invitation_id UUID;
  result JSONB;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = current_user_id AND role = 'admin'
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
  
  -- Generate invitation token
  invitation_token := encode(gen_random_bytes(32), 'hex');
  
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
    invitation_token,
    NOW() + (expires_in_hours || ' hours')::INTERVAL
  ) RETURNING id INTO invitation_id;
  
  -- Return invitation details - use local variable explicitly to avoid ambiguity
  SELECT jsonb_build_object(
    'id', invitation_id,
    'email', invite_email,
    'role', user_role,
    'invitation_token', invitation_token,
    'expires_at', ui.expires_at,
    'invitation_url', 'http://127.0.0.1:5173/admin/invite?token=' || invitation_token
  ) INTO result
  FROM user_invitations ui
  WHERE ui.id = invitation_id;
  
  RETURN result;
END;
$$; 