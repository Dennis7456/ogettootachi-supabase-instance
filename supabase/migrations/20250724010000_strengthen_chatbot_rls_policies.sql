-- Strengthen RLS policies for chatbot_conversations to explicitly deny NULL auth.uid()

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.chatbot_conversations;

-- Recreate the SELECT policy with explicit NULL check
CREATE POLICY "Users can view their own conversations" 
ON public.chatbot_conversations 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Verify the policy was created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'chatbot_conversations'
    AND policyname = 'Users can view their own conversations'
  ) THEN
    RAISE EXCEPTION 'Failed to create SELECT policy for chatbot_conversations';
  END IF;
END $$;
