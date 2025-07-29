-- Create user_invitations table
CREATE TABLE IF NOT EXISTS user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff',
    invitation_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    accepted_by UUID REFERENCES auth.users(id)
);

-- Add RLS policies
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own invitations
CREATE POLICY "Users can view their own invitations" 
ON user_invitations FOR SELECT 
TO authenticated
USING (email = auth.email());

-- Allow admins to view all invitations
CREATE POLICY "Admins can view all invitations" 
ON user_invitations FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Allow admins to create invitations
CREATE POLICY "Admins can create invitations" 
ON user_invitations FOR INSERT 
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Allow admins to update invitations
CREATE POLICY "Admins can update invitations" 
ON user_invitations FOR UPDATE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Allow admins to delete invitations
CREATE POLICY "Admins can delete invitations" 
ON user_invitations FOR DELETE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(invitation_token); 