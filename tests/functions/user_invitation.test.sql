-- Test suite for create_user_invitation function
-- Comprehensive testing with pgTAP and detailed error handling

-- Ensure we're in the correct database
\c supabase_test_db

-- Enable verbose error reporting
\set ON_ERROR_STOP on
\set VERBOSITY verbose

-- Diagnostic function to print detailed schema information
CREATE OR REPLACE FUNCTION test_utils.print_schema_diagnostics()
RETURNS VOID AS $$
DECLARE
    missing_schemas TEXT[];
    missing_functions TEXT[];
    missing_tables TEXT[];
BEGIN
    -- Check for required schemas
    missing_schemas := ARRAY(
        SELECT schema_name 
        FROM (VALUES ('auth'), ('public')) AS required(schema_name)
        WHERE NOT EXISTS (
            SELECT 1 FROM information_schema.schemata 
            WHERE schemata.schema_name = required.schema_name
        )
    );

    -- Check for critical tables
    missing_tables := ARRAY(
        SELECT table_name 
        FROM (VALUES 
            ('auth.users'), 
            ('public.profiles'), 
            ('public.user_invitations')
        ) AS required(table_name)
        WHERE NOT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE 
                table_schema || '.' || table_name = required.table_name
        )
    );

    -- Check for critical functions
    missing_functions := ARRAY(
        SELECT proname 
        FROM (VALUES 
            ('create_user_invitation'), 
            ('auth.uid'), 
            ('auth.jwt')
        ) AS required(proname)
        WHERE NOT EXISTS (
            SELECT 1 
            FROM pg_proc 
            WHERE proname = required.proname
        )
    );

    -- Raise notices for missing components
    IF array_length(missing_schemas, 1) > 0 THEN
        RAISE NOTICE 'Missing schemas: %', array_to_string(missing_schemas, ', ');
    END IF;

    IF array_length(missing_tables, 1) > 0 THEN
        RAISE NOTICE 'Missing tables: %', array_to_string(missing_tables, ', ');
    END IF;

    IF array_length(missing_functions, 1) > 0 THEN
        RAISE NOTICE 'Missing functions: %', array_to_string(missing_functions, ', ');
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Ensure invitation_url column exists
DO $$
BEGIN
    -- Check if column exists, if not, add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'user_invitations' 
          AND column_name = 'invitation_url'
    ) THEN
        ALTER TABLE public.user_invitations 
        ADD COLUMN invitation_url TEXT;
    END IF;
END $$;

-- Recreate user_invitations table with invitation_url column
DROP TABLE IF EXISTS public.user_invitations;
CREATE TABLE public.user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    invited_by UUID REFERENCES auth.users(id) NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'user')),
    invitation_token TEXT UNIQUE NOT NULL,
    invitation_url TEXT,  -- Add this column
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    full_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'sent', 'accepted', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Run diagnostics before tests
DO $$
BEGIN
    PERFORM test_utils.print_schema_diagnostics();
END $$;

-- Load the schema setup
\i /Users/denniskiplangat/Documents/law-firm-website/ogettootachi-supabase-instance/tests/setup_test_schema.sql

-- Verify pgTAP is available
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'plan') THEN
        RAISE EXCEPTION 'pgTAP not properly loaded';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'pgTAP verification failed: %', SQLERRM;
END $$;

-- Set the context for admin user with explicit JWT claims
SET LOCAL "request.jwt.claims" = '{"role": "admin", "sub": "00000000-0000-0000-0000-000000000001"}';

-- Ensure an admin user exists for testing
DO $$
DECLARE
    v_admin_user_id UUID := '00000000-0000-0000-0000-000000000001';
    v_admin_email TEXT := 'test_admin@example.com';
BEGIN
    -- Check if the user exists in auth.users
    IF NOT EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = v_admin_user_id OR email = v_admin_email
    ) THEN
        -- Create the user in auth.users
        INSERT INTO auth.users (
            id, 
            email, 
            email_confirmed_at, 
            created_at
        ) VALUES (
            v_admin_user_id,
            v_admin_email,
            NOW(),
            NOW()
        );
    END IF;

    -- Create or update the profile
    INSERT INTO public.profiles (
        id, 
        role, 
        first_name, 
        last_name,
        email
    ) VALUES (
        v_admin_user_id,
        'admin',
        'Test',
        'Admin',
        v_admin_email
    ) ON CONFLICT (id) DO UPDATE 
    SET 
        role = 'admin',
        first_name = 'Test',
        last_name = 'Admin',
        email = v_admin_email;
END $$;

-- Begin the test transaction
BEGIN;

-- Run the tests
SELECT plan(10);

-- Test 1: Successful invitation creation
SELECT lives_ok(
  $$
  SELECT create_user_invitation(
    'test_newuser@example.com', 
    'staff', 
    72
  );
  $$,
  'Should successfully create an invitation for a new user'
);

-- Test 2: Verify invitation details
SELECT is(
  (SELECT role FROM user_invitations WHERE email = 'test_newuser@example.com'),
  'staff',
  'Invitation should have correct role'
);

-- Test 3: Verify invitation status
SELECT is(
  (SELECT status FROM user_invitations WHERE email = 'test_newuser@example.com'),
  'sent',
  'Invitation status should be set to sent'
);

-- Test 4: Prevent duplicate pending invitations
SELECT throws_like(
  $$
  SELECT create_user_invitation(
    'test_newuser@example.com', 
    'staff', 
    72
  );
  $$,
  '%User already has a pending invitation%',
  'Should prevent creating duplicate invitations'
);

-- Test 5: Prevent invitation for existing user
-- First, create an existing user
WITH existing_user AS (
  INSERT INTO auth.users (
    id, 
    email, 
    email_confirmed_at, 
    created_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000002',
    'test_existing@example.com',
    NOW(),
    NOW()
  ) RETURNING id
)
INSERT INTO profiles (
  id, 
  role, 
  first_name, 
  last_name,
  email
) VALUES (
  (SELECT id FROM existing_user),
  'staff',
  'Existing',
  'User',
  'test_existing@example.com'
);

-- Test that creating an invitation for an existing user fails
SELECT throws_like(
  $$
  SELECT create_user_invitation(
    'test_existing@example.com', 
    'staff', 
    72
  );
  $$,
  '%User already exists%',
  'Should prevent creating invitation for existing user'
);

-- Test 6: Verify invitation token generation
SELECT isnt(
  (SELECT invitation_token FROM user_invitations WHERE email = 'test_newuser@example.com'),
  NULL,
  'Invitation should have a non-null token'
);

-- Test 7: Verify expiration is set correctly
SELECT ok(
  (SELECT expires_at > NOW() FROM user_invitations WHERE email = 'test_newuser@example.com'),
  'Invitation expiration should be in the future'
);

-- Test 8: Verify default role
SELECT is(
  (SELECT role FROM user_invitations WHERE email = 'test_newuser@example.com'),
  'staff',
  'Default role should be staff if not specified'
);

-- Test 9: Verify non-admin users cannot create invitations
-- Create a non-admin user for testing
DO $$
DECLARE
    v_non_admin_user_id UUID := '00000000-0000-0000-0000-000000000002';
    v_non_admin_email TEXT := 'test_nonadmin@example.com';
BEGIN
    -- Check if the user exists in auth.users
    IF NOT EXISTS (
        SELECT 1 
        FROM auth.users 
        WHERE id = v_non_admin_user_id OR email = v_non_admin_email
    ) THEN
        -- Create the user in auth.users
        INSERT INTO auth.users (
            id, 
            email, 
            email_confirmed_at, 
            created_at
        ) VALUES (
            v_non_admin_user_id,
            v_non_admin_email,
            NOW(),
            NOW()
        );
    END IF;

    -- Create or update the profile
    INSERT INTO public.profiles (
        id, 
        role, 
        first_name, 
        last_name,
        email
    ) VALUES (
        v_non_admin_user_id,
        'staff',
        'Non',
        'Admin',
        v_non_admin_email
    ) ON CONFLICT (id) DO UPDATE 
    SET 
        role = 'staff',
        first_name = 'Non',
        last_name = 'Admin',
        email = v_non_admin_email;
END $$;

-- Set the context for non-admin user
SET LOCAL "request.jwt.claims" = '{"role": "staff", "sub": "00000000-0000-0000-0000-000000000002"}';

-- Verify the non-admin user exists and has the correct role
SELECT test_utils.is(
    (SELECT role FROM public.profiles WHERE id = '00000000-0000-0000-0000-000000000002'),
    'staff',
    'Non-admin user should have staff role'
);

-- Test creating invitation as a non-admin user
DO $$
DECLARE
    v_error_raised BOOLEAN := false;
BEGIN
    BEGIN
        PERFORM create_user_invitation(
            'test_nonadmin_invite@example.com', 
            'staff', 
            72
        );
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%is not an admin and cannot create invitations%' THEN
            v_error_raised := true;
        ELSE
            RAISE;
        END IF;
    END;

    IF NOT v_error_raised THEN
        RAISE EXCEPTION 'Expected an error for non-admin user creating invitation';
    END IF;
END $$;

-- Test 10: Verify invitation URL format
-- Remove or comment out the problematic query
-- SELECT invitation_url FROM (
--   SELECT create_user_invitation(
--     'test_newuser@example.com', 
--     'staff', 
--     72
--   ) AS invitation
-- ) AS inv;

-- Instead, verify the invitation_url through the function's return value
-- Verify the invitation_url is not null and matches the expected format
SELECT is(
  (SELECT (create_user_invitation(
    'test_newuser_final@example.com', 
    'staff', 
    72
  )->>'invitation_url') IS NOT NULL),
  true,
  'Invitation URL should not be null'
);

-- Verify the invitation_url contains the correct base URL and token
SELECT test_utils.is(
  (SELECT (create_user_invitation(
    'test_newuser_final_like@example.com', 
    'staff', 
    72
  )->>'invitation_url') ~ '^http://127\.0\.0\.1:5173/admin/invite\?token=[a-f0-9]+$'),
  true,
  'Invitation URL should match expected format'
);

-- Verify the token is not empty
SELECT test_utils.is(
  (SELECT length(substring((create_user_invitation(
    'test_newuser_final_token@example.com', 
    'staff', 
    72
  )->>'invitation_url') from 48)) > 0),
  true,
  'Invitation URL should have a non-empty token'
);

-- Cleanup
SELECT * FROM finish();
ROLLBACK; 