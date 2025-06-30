-- Fix ambiguous column reference in create_user_invitation function
-- The issue was that 'invitation_token' could refer to either the local variable or table column

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
  
  -- Return invitation details - use table alias to avoid ambiguity
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