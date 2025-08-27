-- Fix RLS policies for user_invitations to allow public access by invitation token
-- This is needed for the invitation flow where users are not yet authenticated

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Users can view their own invitations" ON user_invitations;

-- Create new policy that allows public access by invitation token
CREATE POLICY "Public can view invitations by token" ON user_invitations 
FOR SELECT USING (
  -- Allow access if user is authenticated and it's their email
  (auth.role() = 'authenticated' AND email = auth.email())
  OR
  -- Allow access if user is admin or service role
  (auth.role() = 'service_role')
  OR
  -- Allow access for invitation token lookup (this is the key addition)
  (invitation_token IS NOT NULL)
);

-- Also ensure the table has RLS enabled
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY; 