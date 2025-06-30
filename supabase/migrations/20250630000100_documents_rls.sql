-- Allow only admins to insert documents
CREATE POLICY "Admins can insert documents" ON documents
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Allow only admins to update documents
CREATE POLICY "Admins can update documents" ON documents
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Allow service_role to update embeddings
CREATE POLICY "Service role can update embeddings" ON documents
  FOR UPDATE USING (auth.role() = 'service_role'); 