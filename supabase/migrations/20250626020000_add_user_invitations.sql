-- Add user invitation functionality
-- This migration adds tables and functions for admin user management

-- Create user invitations table
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES auth.users(id) NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
  invitation_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for invitation tokens
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires ON user_invitations(expires_at);

-- Enable RLS
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_invitations
DROP POLICY IF EXISTS "Admins can view all invitations" ON user_invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON user_invitations;
DROP POLICY IF EXISTS "Admins can update invitations" ON user_invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON user_invitations;
DROP POLICY IF EXISTS "Users can view their own invitation" ON user_invitations;

-- Only admins can view all invitations
CREATE POLICY "Admins can view all invitations" ON user_invitations
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Only admins can create invitations
CREATE POLICY "Admins can create invitations" ON user_invitations
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Only admins can update invitations
CREATE POLICY "Admins can update invitations" ON user_invitations
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Only admins can delete invitations
CREATE POLICY "Admins can delete invitations" ON user_invitations
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Users can view their own invitation by email (for accepting)
CREATE POLICY "Users can view their own invitation" ON user_invitations
  FOR SELECT USING (email = auth.jwt() ->> 'email');

-- Function to create user invitation
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
  
  -- Return invitation details
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

-- Function to accept user invitation
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
  WHERE invitation_token = accept_user_invitation.invitation_token
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
      updated_at = NOW()
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

-- Function to get pending invitations
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
    WHERE id = auth.uid() AND role = 'admin'
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

-- Function to cancel invitation
CREATE OR REPLACE FUNCTION cancel_invitation(invitation_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_user_invitation(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_user_invitation(TEXT, TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_pending_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_invitation(UUID) TO authenticated;

-- Update the check_admin_exists function to only check for confirmed admins
CREATE OR REPLACE FUNCTION check_admin_exists()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles p
    JOIN auth.users u ON p.id = u.id
    WHERE p.role = 'admin' 
      AND u.email_confirmed_at IS NOT NULL
  );
END;
$$;

GRANT EXECUTE ON FUNCTION check_admin_exists() TO anon, authenticated; 