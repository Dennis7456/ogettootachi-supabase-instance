-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- 2. Add RLS policies for profiles
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
    
    -- Add new policies
    CREATE POLICY "Allow public read access to profiles"
    ON public.profiles
    FOR SELECT
    USING (true);
    
    CREATE POLICY "Allow users to update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);
END $$;

-- 3. Add RLS policies for documents
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read access to documents" ON public.documents;
    
    CREATE POLICY "Allow public read access to documents"
    ON public.documents
    FOR SELECT
    USING (true);
END $$;

-- 4. Fix chatbot_conversations table if it exists, or create it
DO $$
BEGIN
    -- Create the table if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id TEXT NOT NULL,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        messages JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Add RLS policies
    DROP POLICY IF EXISTS "Allow users to manage their conversations" ON public.chatbot_conversations;
    
    CREATE POLICY "Allow users to manage their conversations"
    ON public.chatbot_conversations
    FOR ALL
    USING (auth.uid() = user_id OR user_id IS NULL);
    
    -- Add index for better performance
    CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id 
    ON public.chatbot_conversations(user_id);
    
    CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_session_id 
    ON public.chatbot_conversations(session_id);
END $$;

-- 5. Expose the get_table_info function to the API
COMMENT ON FUNCTION public.get_table_info IS 'Check if a table exists in the public schema';

-- 6. Ensure the profiles table has all required columns
DO $$
BEGIN
    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'profiles' 
                  AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
    
    -- Add first_name and last_name if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'profiles' 
                  AND column_name = 'first_name') THEN
        ALTER TABLE public.profiles ADD COLUMN first_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'profiles' 
                  AND column_name = 'last_name') THEN
        ALTER TABLE public.profiles ADD COLUMN last_name TEXT;
    END IF;
    
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'profiles' 
                  AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;
