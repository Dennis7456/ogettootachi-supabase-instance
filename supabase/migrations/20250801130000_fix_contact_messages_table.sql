-- Fix contact_messages table by adding missing columns
-- The frontend is trying to insert phone, subject, practice_area, status, and priority

-- Add missing columns to contact_messages table
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS practice_area text;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS status text DEFAULT 'new';
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal';

-- Add additional useful columns for better contact management
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS read_at timestamp with time zone;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS replied_at timestamp with time zone;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES profiles(id);
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_priority ON contact_messages(priority);
CREATE INDEX IF NOT EXISTS idx_contact_messages_practice_area ON contact_messages(practice_area);
CREATE INDEX IF NOT EXISTS idx_contact_messages_assigned_to ON contact_messages(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON contact_messages(email);

-- Add check constraints for valid status and priority values
ALTER TABLE contact_messages ADD CONSTRAINT check_contact_status 
CHECK (status IN ('new', 'read', 'in_progress', 'resolved', 'archived'));

ALTER TABLE contact_messages ADD CONSTRAINT check_contact_priority 
CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- Enable RLS if not already enabled
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Update existing RLS policies to be more comprehensive
-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Service role can do everything on contact_messages" ON contact_messages;

-- Allow anonymous users to insert contact messages (for public contact form)
CREATE POLICY "Allow anonymous insert on contact_messages" 
ON contact_messages FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to insert contact messages
CREATE POLICY "Allow authenticated insert on contact_messages" 
ON contact_messages FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow admins and staff to view all contact messages
CREATE POLICY "Admins and staff can view contact_messages" 
ON contact_messages FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'staff')
    )
);

-- Allow admins and staff to update contact messages
CREATE POLICY "Admins and staff can update contact_messages" 
ON contact_messages FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'staff')
    )
);

-- Allow admins to delete contact messages
CREATE POLICY "Admins can delete contact_messages" 
ON contact_messages FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- Allow service role full access
CREATE POLICY "Service role full access on contact_messages" 
ON contact_messages FOR ALL 
TO service_role
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_contact_messages_updated_at 
BEFORE UPDATE ON contact_messages 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Add table comments
COMMENT ON TABLE contact_messages IS 'Stores contact form submissions from website visitors';
COMMENT ON COLUMN contact_messages.status IS 'Status of the contact message: new, read, in_progress, resolved, archived';
COMMENT ON COLUMN contact_messages.priority IS 'Priority level: low, normal, high, urgent';
COMMENT ON COLUMN contact_messages.practice_area IS 'Legal practice area the inquiry relates to';
COMMENT ON COLUMN contact_messages.assigned_to IS 'Staff member assigned to handle this message';
COMMENT ON COLUMN contact_messages.read_at IS 'When the message was first read by staff';
COMMENT ON COLUMN contact_messages.replied_at IS 'When a reply was sent to the client';