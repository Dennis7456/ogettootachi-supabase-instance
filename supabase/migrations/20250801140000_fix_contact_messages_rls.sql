-- Fix RLS policies for contact_messages to ensure anonymous users can insert

-- Drop existing insert policies and recreate them more explicitly
DROP POLICY IF EXISTS "Allow anonymous insert on contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow authenticated insert on contact_messages" ON contact_messages;

-- Create a comprehensive insert policy that allows both anonymous and authenticated users
CREATE POLICY "Anyone can insert contact_messages" 
ON contact_messages FOR INSERT 
WITH CHECK (true);

-- Ensure the anon role has the necessary permissions
GRANT INSERT ON contact_messages TO anon;
GRANT INSERT ON contact_messages TO authenticated;

-- Also grant usage on the sequence for id generation
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Double-check that RLS is enabled
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Verify the policy works by testing it
-- This will help us see if there are any issues
SELECT 'RLS policies updated successfully for contact_messages' as status;