-- Fix RLS policies for documents table to allow service role operations
-- (DROP POLICY lines removed to prevent errors on db reset)

-- Create new policy that allows both admin JWT and service role
CREATE POLICY "Allow admin and service role to insert documents" ON documents
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.role() = 'service_role'
  );

-- Create new policy that allows both admin JWT and service role
CREATE POLICY "Allow admin and service role to update documents" ON documents
  FOR UPDATE USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.role() = 'service_role'
  );

-- Add a policy to allow service role to insert documents (redundant but explicit)
CREATE POLICY "Service role can insert documents" ON documents
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Add a policy to allow service role to select documents
CREATE POLICY "Service role can select documents" ON documents
  FOR SELECT USING (auth.role() = 'service_role'); 