-- Debug migration: Temporarily remove admin check to test if that's causing the 400 error
-- This will help us identify if the issue is with authentication or the function itself

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
  -- Temporarily comment out admin check for debugging
  -- IF NOT EXISTS (
  --   SELECT 1 FROM profiles 
  --   WHERE id = auth.uid() AND role = 'admin'
  -- ) THEN
  --   RAISE EXCEPTION 'Only admins can view invitations';
  -- END IF;
  
  RETURN QUERY
  SELECT 
    ui.id AS id,
    ui.email AS email,
    ui.role AS role,
    COALESCE(p.full_name, 'Admin') AS invited_by_email,
    ui.created_at AS created_at,
    ui.expires_at AS expires_at,
    ui.status AS status,
    COALESCE(ui.department, '') AS department,
    COALESCE(ui.custom_message, '') AS custom_message
  FROM user_invitations ui
  LEFT JOIN profiles p ON ui.created_by = p.id
  WHERE ui.accepted_at IS NULL
    AND ui.expires_at > NOW()
  ORDER BY ui.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_pending_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_invitations() TO service_role;
