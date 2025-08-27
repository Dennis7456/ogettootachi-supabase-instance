-- Fix create_user_invitation function to prevent timeouts and correct syntax
-- This migration fixes the SQL syntax issues and optimizes the function

CREATE OR REPLACE FUNCTION create_user_invitation(
  invite_email TEXT,
  user_role TEXT DEFAULT 'staff',
  department TEXT DEFAULT NULL,
  custom_message TEXT DEFAULT NULL,
  onboarding_type TEXT DEFAULT 'standard',
  preferred_start_date TIMESTAMPTZ DEFAULT NULL,
  additional_permissions JSONB DEFAULT NULL,
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
  expires_at TIMESTAMPTZ;
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
  
  -- Calculate expiration time
  expires_at := NOW() + (expires_in_hours || ' hours')::INTERVAL;
  
  -- Create invitation
  INSERT INTO user_invitations (
    email, 
    invited_by, 
    role, 
    invitation_token, 
    expires_at,
    department,
    custom_message,
    status
  ) VALUES (
    invite_email,
    current_user_id,
    user_role,
    invitation_token,
    expires_at,
    department,
    custom_message,
    'sent'
  ) RETURNING id INTO invitation_id;
  
  -- Return invitation details
  SELECT jsonb_build_object(
    'id', invitation_id,
    'email', invite_email,
    'role', user_role,
    'invitation_token', invitation_token,
    'expires_at', expires_at,
    'department', department,
    'status', 'sent',
    'invitation_url', 'https://ogetto-otachi-law-firm.web.app/password-setup?token=' || invitation_token || '&type=invite'
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_user_invitation(TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, JSONB, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_invitation(TEXT, TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ, JSONB, INTEGER) TO service_role;
