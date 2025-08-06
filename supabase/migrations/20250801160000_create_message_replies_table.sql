-- Create message_replies table to store replies to contact messages
-- This allows for proper conversation threading and chat history

CREATE TABLE IF NOT EXISTS message_replies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id uuid NOT NULL REFERENCES contact_messages(id) ON DELETE CASCADE,
    sender_id uuid REFERENCES profiles(id),
    sender_name text NOT NULL,
    sender_email text NOT NULL,
    reply_content text NOT NULL,
    reply_subject text,
    sent_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_replies_message_id ON message_replies(message_id);
CREATE INDEX IF NOT EXISTS idx_message_replies_sender_id ON message_replies(sender_id);
CREATE INDEX IF NOT EXISTS idx_message_replies_sent_at ON message_replies(sent_at);
CREATE INDEX IF NOT EXISTS idx_message_replies_created_at ON message_replies(created_at);

-- Enable RLS
ALTER TABLE message_replies ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert replies
CREATE POLICY "Allow authenticated insert on message_replies" 
ON message_replies FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow admins and staff to view all replies
CREATE POLICY "Admins and staff can view message_replies" 
ON message_replies FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'staff')
    )
);

-- Allow admins and staff to update replies
CREATE POLICY "Admins and staff can update message_replies" 
ON message_replies FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('admin', 'staff')
    )
);

-- Allow admins to delete replies
CREATE POLICY "Admins can delete message_replies" 
ON message_replies FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- Allow service role full access
CREATE POLICY "Service role full access on message_replies" 
ON message_replies FOR ALL 
TO service_role
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_message_replies_updated_at 
BEFORE UPDATE ON message_replies 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Add table comments
COMMENT ON TABLE message_replies IS 'Stores replies to contact messages for conversation threading';
COMMENT ON COLUMN message_replies.message_id IS 'Reference to the original contact message';
COMMENT ON COLUMN message_replies.sender_id IS 'ID of the staff member who sent the reply';
COMMENT ON COLUMN message_replies.sender_name IS 'Name of the person sending the reply';
COMMENT ON COLUMN message_replies.sender_email IS 'Email of the person sending the reply';
COMMENT ON COLUMN message_replies.reply_content IS 'The content of the reply message';
COMMENT ON COLUMN message_replies.reply_subject IS 'Subject line of the reply email';
COMMENT ON COLUMN message_replies.sent_at IS 'When the reply was sent via email'; 