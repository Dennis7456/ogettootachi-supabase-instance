-- Add missing columns to user_invitations table
-- This migration adds the department and custom_message columns that are referenced in the get_pending_invitations function

ALTER TABLE user_invitations 
ADD COLUMN IF NOT EXISTS department TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS custom_message TEXT DEFAULT NULL;

-- Create index for department column for better query performance
CREATE INDEX IF NOT EXISTS idx_user_invitations_department ON user_invitations(department);

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_pending_invitations() TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_invitations() TO service_role;
