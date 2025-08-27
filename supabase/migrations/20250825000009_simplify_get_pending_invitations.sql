-- Simplify get_pending_invitations function to debug issues
-- This migration creates a minimal version to identify the problem

CREATE OR REPLACE FUNCTION get_pending_invitations()
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  invited_by_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  department TEXT,
  custom_message TEXT
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
    'Admin' as invited_by_email,
    ui.created_at,
    ui.expires_at,
    ui.status,
    ui.department,
    ui.custom_message
  FROM user_invitations ui
  WHERE ui.accepted_at IS NULL
    AND ui.expires_at > NOW()
  ORDER BY ui.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_pending_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_invitations() TO service_role;
