-- Fix documents table RLS policies to check user_metadata for admin role
-- This migration fixes the documents table policies to allow admin operations

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Documents are viewable by authenticated users" ON documents;
DROP POLICY IF EXISTS "Documents are insertable by admins" ON documents;
DROP POLICY IF EXISTS "Documents are updatable by admins" ON documents;
DROP POLICY IF EXISTS "Documents are deletable by admins" ON documents;
DROP POLICY IF EXISTS "Allow admin and service role to insert documents" ON documents;
DROP POLICY IF EXISTS "Allow admin and service role to update documents" ON documents;
DROP POLICY IF EXISTS "Service role can insert documents" ON documents;
DROP POLICY IF EXISTS "Service role can select documents" ON documents;
DROP POLICY IF EXISTS "Service role can update embeddings" ON documents;
DROP POLICY IF EXISTS "Admins can insert documents" ON documents;
DROP POLICY IF EXISTS "Admins can update documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can insert documents" ON documents;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON documents;

-- Create new policies that check user_metadata for admin role
CREATE POLICY "Documents are viewable by authenticated users" ON documents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Documents are insertable by admins" ON documents
  FOR INSERT WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
    auth.role() = 'service_role'
  );

CREATE POLICY "Documents are updatable by admins" ON documents
  FOR UPDATE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
    auth.role() = 'service_role'
  );

CREATE POLICY "Documents are deletable by admins" ON documents
  FOR DELETE USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR 
    auth.role() = 'service_role'
  ); 