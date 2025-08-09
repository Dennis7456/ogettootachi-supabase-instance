-- Update the status column check constraint in user_invitations table
-- This migration updates the existing check constraint to include 'sent' status

-- Drop the existing check constraint
ALTER TABLE user_invitations
DROP CONSTRAINT IF EXISTS user_invitations_status_check;

-- Add the new check constraint
ALTER TABLE user_invitations
ADD CONSTRAINT user_invitations_status_check
CHECK (status IN ('pending', 'sent', 'accepted', 'expired'));

-- Update any existing 'pending' status to 'sent' for invitations that have been processed
UPDATE user_invitations
SET status = 'sent'
WHERE status = 'pending' AND invitation_token IS NOT NULL; 