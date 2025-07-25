-- Migration: Fix RLS policies for public.documents to allow admin and user access

-- Drop old/broad SELECT policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;
DROP POLICY IF EXISTS "Admins can view all documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;

-- Allow admins to read all documents
CREATE POLICY "Admins can view all documents"
  ON public.documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow users to read their own documents
CREATE POLICY "Users can view own documents"
  ON public.documents
  FOR SELECT
  USING (user_id = auth.uid()); 