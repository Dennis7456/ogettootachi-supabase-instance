-- First, create or replace the function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_full_name TEXT;
  v_email TEXT;
  v_role TEXT;
BEGIN
  -- Safely extract values with defaults
  v_email := COALESCE(NEW.email, '');
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::text, 'user');
  
  -- Extract first_name and last_name from raw_user_meta_data
  v_first_name := NULLIF(NEW.raw_user_meta_data->>'first_name', '');
  v_last_name := NULLIF(NEW.raw_user_meta_data->>'last_name', '');
  
  -- If first_name is not provided, try to extract from full_name
  IF v_first_name IS NULL THEN
    v_full_name := NULLIF(NEW.raw_user_meta_data->>'full_name', '');
    IF v_full_name IS NOT NULL THEN
      v_first_name := split_part(v_full_name, ' ', 1);
      -- Get everything after the first space as last name
      v_last_name := NULLIF(trim(substring(v_full_name from position(' ' in v_full_name))), '');
    END IF;
  END IF;
  
  -- Set default values if still null
  v_first_name := COALESCE(v_first_name, 'User');
  v_last_name := COALESCE(v_last_name, '');
  
  -- Insert the new profile
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name, 
    last_name, 
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id, 
    v_email,
    v_first_name,
    v_last_name,
    v_role,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop all existing policies to avoid conflicts
DO $$
DECLARE
  policy_record RECORD;
  policy_sql TEXT;
BEGIN
  -- Drop policies for all tables
  FOR policy_record IN 
    SELECT n.nspname AS schema_name, c.relname AS table_name, pol.polname AS policy_name
    FROM pg_policy pol
    JOIN pg_class c ON c.oid = pol.polrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relname IN ('profiles', 'documents', 'chatbot_conversations')
  LOOP
    policy_sql := format('DROP POLICY IF EXISTS %I ON %I.%I', 
                         policy_record.policy_name, 
                         policy_record.schema_name, 
                         policy_record.table_name);
    EXECUTE policy_sql;
    RAISE NOTICE 'Dropped policy % on %.%', 
                 policy_record.policy_name, 
                 policy_record.schema_name, 
                 policy_record.table_name;
  END LOOP;
END;
$$;

-- Create a function to safely create or replace policies
CREATE OR REPLACE FUNCTION create_or_replace_policy(
  policy_name TEXT,
  table_name TEXT,
  command TEXT,
  using_expression TEXT DEFAULT NULL,
  with_check_expression TEXT DEFAULT NULL
) RETURNS void AS $$
DECLARE
  using_clause TEXT := '';
  with_check_clause TEXT := '';
BEGIN
  -- Drop existing policy
  EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, table_name);

  -- Build USING clause only for non-INSERT commands
  IF command != 'INSERT' AND using_expression IS NOT NULL THEN
    using_clause := format(' USING (%s)', using_expression);
  END IF;

  -- Build WITH CHECK clause only when provided
  IF with_check_expression IS NOT NULL THEN
    with_check_clause := format(' WITH CHECK (%s)', with_check_expression);
  END IF;

  -- Build and run CREATE POLICY
  EXECUTE format(
    'CREATE POLICY %I ON public.%I FOR %s%s%s',
    policy_name,
    table_name,
    command,
    using_clause,
    with_check_clause
  );

  RAISE NOTICE 'Created/updated policy % on public.%', policy_name, table_name;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error creating/updating policy % on public.%: %',
                policy_name, table_name, SQLERRM;
  RAISE;
END;
$$ LANGUAGE plpgsql;

-- Now create all policies with secure defaults
DO $$
BEGIN
  -- First, enable RLS on all tables
  EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY';
  
  -- For profiles: Only allow users to see their own profile
  PERFORM create_or_replace_policy(
    'Users can view their own profile',
    'profiles',
    'SELECT',
    'auth.uid() = id'
  );
  
  -- Documents are viewable by all authenticated users (no user ownership)
  PERFORM create_or_replace_policy(
    'Documents are viewable by authenticated users',
    'documents',
    'SELECT',
    'auth.role() = ''authenticated'''
  );
  
  -- Only admins can insert/update/delete documents
  PERFORM create_or_replace_policy(
    'Documents are insertable by admins',
    'documents',
    'INSERT',
    NULL,  -- No USING for INSERT
    'auth.jwt() ->> ''role'' = ''admin'''  -- Only WITH CHECK
  );
  
  PERFORM create_or_replace_policy(
    'Documents are updatable by admins',
    'documents',
    'UPDATE',
    'auth.jwt() ->> ''role'' = ''admin'''
  );
  
  PERFORM create_or_replace_policy(
    'Documents are deletable by admins',
    'documents',
    'DELETE',
    'auth.jwt() ->> ''role'' = ''admin'''
  );
  
  -- Chatbot conversations are owned by users
  PERFORM create_or_replace_policy(
    'Users can view their own conversations',
    'chatbot_conversations',
    'SELECT',
    'auth.uid() = user_id',
    NULL
  );
  
  PERFORM create_or_replace_policy(
    'Users can insert their own conversations',
    'chatbot_conversations',
    'INSERT',
    'auth.role() = ''authenticated''',  -- Check auth in USING
    'auth.uid() = user_id'  -- Verify user_id matches in WITH CHECK
  );
  
  -- Allow users to update their own conversations
  PERFORM create_or_replace_policy(
    'Users can update their own conversations',
    'chatbot_conversations',
    'UPDATE',
    'auth.uid() = user_id',
    'auth.uid() = user_id'
  );
  
  -- Allow users to update their own profile
  PERFORM create_or_replace_policy(
    'Users can update their own profile',
    'profiles',
    'UPDATE',
    'auth.uid() = id',
    'auth.uid() = id'
  );
  
  -- Deny all other operations by default
  PERFORM create_or_replace_policy(
    'Deny all operations by default',
    'profiles',
    'ALL',
    'false'
  );
  
  PERFORM create_or_replace_policy(
    'Deny all operations by default',
    'documents',
    'ALL',
    'false'
  );
  
  PERFORM create_or_replace_policy(
    'Deny all operations by default',
    'chatbot_conversations',
    'ALL',
    'false'
  );
  
  RAISE NOTICE 'Finished creating all RLS policies';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error in policy creation: %', SQLERRM;
  RAISE;
END;
$$;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    RAISE NOTICE 'Created auth.users trigger';
  END IF;
END;
$$;

-- Ensure the chatbot_conversations table has all required columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'chatbot_conversations' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.chatbot_conversations 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) NOT NULL;
    RAISE NOTICE 'Added user_id column to chatbot_conversations';
  END IF;
  
  -- Ensure the profiles table has all required columns
  ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
  
  RAISE NOTICE 'Updated table schemas';
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Error updating schemas: %', SQLERRM;
  RAISE;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
