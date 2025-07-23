-- Add full_name and status columns to user_invitations table
-- This allows storing additional metadata during the invitation process

-- Add full_name column if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='user_invitations' AND column_name='full_name'
    ) THEN
        ALTER TABLE user_invitations 
        ADD COLUMN full_name TEXT NULL;
    END IF;
END $$;

-- Add status column with a check constraint if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='user_invitations' AND column_name='status'
    ) THEN
        ALTER TABLE user_invitations 
        ADD COLUMN status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'sent', 'accepted', 'expired'));
    END IF;
END $$;

-- Add comments to explain the columns
COMMENT ON COLUMN user_invitations.full_name IS 'Full name of the invited user';
COMMENT ON COLUMN user_invitations.status IS 'Status of the invitation: pending, sent, accepted, or expired';

-- Update the create_user_invitation function to handle the new columns
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
  v_admin_user_id UUID;
  v_jwt_claims JSONB;
BEGIN
  -- Try to get current user ID from JWT claims
  BEGIN
    v_jwt_claims := current_setting('request.jwt.claims', true)::jsonb;
    current_user_id := v_jwt_claims->>'sub';
    
    -- Log the JWT claims for debugging
    RAISE NOTICE 'JWT Claims: %', v_jwt_claims;
    RAISE NOTICE 'Extracted user ID: %', current_user_id;
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
    RAISE NOTICE 'Could not extract user ID from JWT claims';
  END;

  -- Validate the user ID is a valid UUID
  IF current_user_id IS NULL OR current_user_id = '' THEN
    RAISE EXCEPTION 'Invalid or missing user ID in JWT claims';
  END IF;

  -- If current_user_id is null or empty, find an admin user
  IF current_user_id IS NULL OR current_user_id = '' THEN
    -- Try to find an existing admin user
    SELECT id INTO v_admin_user_id 
    FROM profiles 
    WHERE role = 'admin' 
    LIMIT 1;
    
    -- If no admin user exists, create a default admin user
    IF v_admin_user_id IS NULL THEN
      -- Create a default admin user in auth.users
      INSERT INTO auth.users (
        id, 
        email, 
        email_confirmed_at, 
        created_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000001',
        'system_admin@example.com',
        NOW(),
        NOW()
      ) ON CONFLICT (id) DO NOTHING;
      
      -- Create corresponding profile
      INSERT INTO profiles (
        id, 
        role, 
        first_name, 
        last_name,
        email
      ) VALUES (
        '00000000-0000-0000-0000-000000000001',
        'admin',
        'System',
        'Admin',
        'system_admin@example.com'
      ) ON CONFLICT (id) DO NOTHING;
      
      v_admin_user_id := '00000000-0000-0000-0000-000000000001';
    END IF;
    
    current_user_id := v_admin_user_id;
    RAISE NOTICE 'Using default admin user ID: %', current_user_id;
  END IF;

  -- Verify the user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = current_user_id AND role = 'admin'
  ) THEN
    DECLARE
      v_user_role TEXT;
    BEGIN
      -- Get the user's role
      SELECT role INTO v_user_role 
      FROM profiles 
      WHERE id = current_user_id;
      
      -- Raise an exception with the user's role
      RAISE EXCEPTION 'User % with role % is not an admin and cannot create invitations', 
        current_user_id, 
        COALESCE(v_user_role, 'unknown');
    END;
  END IF;
  
  -- Check if email already has an invitation
  IF EXISTS (
    SELECT 1 FROM user_invitations 
    WHERE email = invite_email AND status IN ('pending', 'sent')
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
  v_invitation_token := encode(gen_random_bytes(32), 'hex');
  
  -- Create invitation
  INSERT INTO user_invitations (
    email, 
    invited_by, 
    role, 
    invitation_token, 
    expires_at,
    full_name,
    status
  ) VALUES (
    invite_email,
    current_user_id,
    user_role,
    v_invitation_token,
    NOW() + (expires_in_hours || ' hours')::INTERVAL,
    NULL,  -- Default to NULL if no full name provided
    'sent' -- Set status to 'sent' when invitation is created
  ) RETURNING id INTO v_invitation_id;
  
  -- Return invitation details
  SELECT jsonb_build_object(
    'id', v_invitation_id,
    'email', invite_email,
    'role', user_role,
    'invitation_token', v_invitation_token,
    'expires_at', ui.expires_at,
    'full_name', ui.full_name,
    'status', ui.status,
    'invitation_url', 'http://127.0.0.1:5173/admin/invite?token=' || v_invitation_token
  ) INTO v_result
  FROM user_invitations ui
  WHERE ui.id = v_invitation_id;
  
  RETURN v_result;
END;
$$; 