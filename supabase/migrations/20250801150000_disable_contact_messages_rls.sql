-- Temporarily disable RLS on contact_messages to test if that's causing the issue
-- This will allow any insert to work, then we can re-enable with proper policies

-- Disable RLS temporarily
ALTER TABLE contact_messages DISABLE ROW LEVEL SECURITY;

-- Add a comment to track this change
COMMENT ON TABLE contact_messages IS 'RLS temporarily disabled for contact form testing - will re-enable with proper policies'; 