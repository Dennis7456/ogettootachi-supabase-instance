-- Create user_invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL,
    role text NOT NULL DEFAULT 'staff',
    invitation_token text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone,
    created_by uuid,
    accepted_by uuid,
    accepted_at timestamp with time zone,
    invited_by uuid,
    full_name text
);

-- Add status column to user_invitations table
ALTER TABLE user_invitations 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired'));

-- Add password_set column to track if user has set their password
ALTER TABLE user_invitations 
ADD COLUMN IF NOT EXISTS password_set boolean DEFAULT false;

-- Add last_sent_at column to track when invitation was last sent
ALTER TABLE user_invitations 
ADD COLUMN IF NOT EXISTS last_sent_at timestamp with time zone DEFAULT now();

-- Add sent_count column to track how many times invitation was sent
ALTER TABLE user_invitations 
ADD COLUMN IF NOT EXISTS sent_count integer DEFAULT 1;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_invitations_status ON user_invitations(status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email_status ON user_invitations(email, status);

-- Add comments for documentation
COMMENT ON COLUMN user_invitations.status IS 'Status of the invitation: pending, accepted, or expired';
COMMENT ON COLUMN user_invitations.password_set IS 'Whether the user has set their password after accepting invitation';
COMMENT ON COLUMN user_invitations.last_sent_at IS 'When the invitation was last sent';
COMMENT ON COLUMN user_invitations.sent_count IS 'How many times this invitation has been sent';
