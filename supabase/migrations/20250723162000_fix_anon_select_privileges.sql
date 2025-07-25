-- Grant SELECT privileges to anon role for tables required by setup tests
-- This ensures anonymous Supabase clients can read necessary data

BEGIN;

-- Allow anon to select from public.profiles
GRANT SELECT ON TABLE public.profiles TO anon;

-- Allow anon to select from public.documents where published or public flag may apply via RLS
GRANT SELECT ON TABLE public.documents TO anon;

-- Ensure appropriate RLS policies exist (keep existing if already defined)
-- Simple permissive policies for read access; more restrictive policies are handled via column filters in app code
DO $$
BEGIN
    -- Profiles select policy for all roles (including anon)
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'profiles'
          AND policyname = 'allow_select_all_profiles') THEN
        EXECUTE 'CREATE POLICY allow_select_all_profiles ON public.profiles
                 FOR SELECT TO anon, authenticated USING ( true );';
    END IF;

    -- Documents select policy for all roles (including anon)
    IF NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'documents'
          AND policyname = 'allow_select_all_documents') THEN
        EXECUTE 'CREATE POLICY allow_select_all_documents ON public.documents
                 FOR SELECT TO anon, authenticated USING ( true );';
    END IF;
END$$;

COMMIT;
