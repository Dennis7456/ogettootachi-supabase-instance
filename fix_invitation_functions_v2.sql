-- Fix the get_pending_invitations function with proper return types
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
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can view invitations';
  END IF;
  
  RETURN QUERY
  SELECT 
    ui.id,
    ui.email::TEXT,
    ui.role::TEXT,
    u.email::TEXT as invited_by_email,
    ui.created_at,
    ui.expires_at
  FROM user_invitations ui
  JOIN auth.users u ON ui.invited_by = u.id
  WHERE ui.accepted_at IS NULL
    AND ui.expires_at > NOW()
  ORDER BY ui.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_pending_invitations() TO authenticated; 