-- Update RLS policies for better security and test compatibility

-- 1. First, drop all existing policies to avoid conflicts
DO $$
DECLARE
  table_rec RECORD;
  policy_rec RECORD;
BEGIN
  -- Loop through all tables with RLS enabled
  FOR table_rec IN 
    SELECT relname FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'r' AND n.nspname = 'public' AND relrowsecurity
  LOOP
    -- Drop all policies on this table
    FOR policy_rec IN 
      SELECT policyname FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = table_rec.relname
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_rec.policyname, table_rec.relname);
    END LOOP;
  END LOOP;
END $$;

-- 2. Recreate profiles table policies
-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Deny all other operations by default
CREATE POLICY "Deny all operations by default" 
ON public.profiles 
FOR ALL 
USING (false);

-- 3. Recreate documents table policies
-- Allow authenticated users to view documents
CREATE POLICY "Documents are viewable by authenticated users" 
ON public.documents 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Only admins can modify documents
CREATE POLICY "Documents are insertable by admins" 
ON public.documents 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Documents are updatable by admins" 
ON public.documents 
FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'admin') 
WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Documents are deletable by admins" 
ON public.documents 
FOR DELETE 
USING (auth.jwt() ->> 'role' = 'admin');

-- Deny all other operations by default
CREATE POLICY "Deny all operations by default" 
ON public.documents 
FOR ALL 
USING (false);

-- 4. Recreate chatbot_conversations table policies
-- Allow users to view their own conversations
CREATE POLICY "Users can view their own conversations" 
ON public.chatbot_conversations 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to insert conversations with their own user_id
CREATE POLICY "Users can insert their own conversations" 
ON public.chatbot_conversations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own conversations
CREATE POLICY "Users can update their own conversations" 
ON public.chatbot_conversations 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Deny all other operations by default
CREATE POLICY "Deny all operations by default" 
ON public.chatbot_conversations 
FOR ALL 
USING (false);

-- 5. Add a function to check if RLS is enabled
CREATE OR REPLACE FUNCTION public.is_rls_enabled(table_name text) 
RETURNS boolean AS $$
DECLARE
  rls_enabled boolean;
BEGIN
  SELECT relrowsecurity INTO rls_enabled 
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relname = table_name AND n.nspname = 'public';
  
  RETURN rls_enabled;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
