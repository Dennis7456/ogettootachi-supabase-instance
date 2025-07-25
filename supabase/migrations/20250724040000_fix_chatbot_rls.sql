-- Fix RLS policies for chatbot_conversations table to ensure proper access control

-- Enable RLS if not already enabled
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
  -- Drop all policies on chatbot_conversations
  EXECUTE (
    SELECT string_agg(format('DROP POLICY IF EXISTS %I ON public.chatbot_conversations', pol.polname), '; ')
    FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    WHERE c.relname = 'chatbot_conversations' AND pol.schemaname = 'public'
  );
  
  RAISE NOTICE 'Dropped existing policies on chatbot_conversations table';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error dropping policies: %', SQLERRM;
END;
$$;

-- Recreate the policies in the correct order (most specific to least specific)

-- 1. Allow service role full access (most permissive, but most specific to service_role)
CREATE POLICY "Service role has full access"
ON public.chatbot_conversations
FOR ALL
USING (auth.role() = 'service_role');

-- 2. Allow users to view their own conversations
CREATE POLICY "Users can view their own conversations" 
ON public.chatbot_conversations 
FOR SELECT 
USING (auth.uid() = user_id);

-- 3. Allow users to insert their own conversations
CREATE POLICY "Users can insert their own conversations" 
ON public.chatbot_conversations 
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 4. Allow users to update their own conversations
CREATE POLICY "Users can update their own conversations" 
ON public.chatbot_conversations 
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Deny all other operations by default (must be last, most general)
CREATE POLICY "Deny all operations by default" 
ON public.chatbot_conversations 
FOR ALL 
USING (false);

-- Verify the policies were created correctly
DO $$
DECLARE
  policy_count INTEGER;
  policy_names TEXT[] := ARRAY[
    'Service role has full access',
    'Users can view their own conversations',
    'Users can insert their own conversations',
    'Users can update their own conversations',
    'Deny all operations by default'
  ];
  policy_name TEXT;
  policy_exists BOOLEAN;
BEGIN
  -- Check total count
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'chatbot_conversations' 
  AND schemaname = 'public';
  
  -- Check each expected policy exists
  FOREACH policy_name IN ARRAY policy_names LOOP
    SELECT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE tablename = 'chatbot_conversations' 
      AND schemaname = 'public' 
      AND policyname = policy_name
    ) INTO policy_exists;
    
    IF NOT policy_exists THEN
      RAISE EXCEPTION 'Policy "%" is missing from chatbot_conversations table', policy_name;
    END IF;
  END LOOP;
  
  IF policy_count != array_length(policy_names, 1) THEN
    RAISE WARNING 'Unexpected number of policies found: % (expected %)', 
      policy_count, array_length(policy_names, 1);
  END IF;
  
  RAISE NOTICE 'Successfully verified % policies on chatbot_conversations table', policy_count;
  
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error verifying policies: %', SQLERRM;
  RAISE;
END;
$$;
