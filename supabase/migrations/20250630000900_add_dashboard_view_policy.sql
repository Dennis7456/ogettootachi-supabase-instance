-- Add policy to allow dashboard to view documents
-- This policy allows the dashboard to view documents even with anon role

-- Add a policy that allows viewing documents for dashboard purposes
CREATE POLICY "Dashboard can view documents" ON documents
  FOR SELECT USING (true);

-- Also add a policy for service role to view all documents (backup)
CREATE POLICY "Service role can view all documents" ON documents
  FOR SELECT USING (auth.role() = 'service_role'); 