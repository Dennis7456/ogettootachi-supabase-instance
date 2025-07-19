-- Setup test schema for user invitations

-- Ensure required extensions are loaded
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create test_utils schema
CREATE SCHEMA IF NOT EXISTS test_utils;

-- Create mock pgTAP functions
CREATE OR REPLACE FUNCTION test_utils.plan(num_tests INTEGER) 
RETURNS VOID AS $$
BEGIN
    RAISE NOTICE 'Mock plan function called with % tests', num_tests;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_utils.finish() 
RETURNS VOID AS $$
BEGIN
    RAISE NOTICE 'Mock finish function called';
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_utils.lives_ok(query TEXT, description TEXT) 
RETURNS VOID AS $$
BEGIN
    RAISE NOTICE 'Mock lives_ok called: %', description;
    EXECUTE query;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_utils.is(actual ANYELEMENT, expected ANYELEMENT, description TEXT) 
RETURNS VOID AS $$
BEGIN
    RAISE NOTICE 'Mock is called: %', description;
    IF actual IS DISTINCT FROM expected THEN
        RAISE EXCEPTION 'Assertion failed: % (% vs %)', description, actual, expected;
    END IF;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION test_utils.throws_like(query TEXT, expected_error TEXT, description TEXT) 
RETURNS VOID AS $$
BEGIN
    RAISE NOTICE 'Mock throws_like called: %', description;
    BEGIN
        EXECUTE query;
        RAISE EXCEPTION 'Expected an error, but none was raised';
    EXCEPTION WHEN OTHERS THEN
        IF NOT SQLERRM LIKE expected_error THEN
            RAISE EXCEPTION 'Error % does not match expected pattern %', SQLERRM, expected_error;
        END IF;
    END;
END
$$ LANGUAGE plpgsql;

-- Ensure auth schema exists
CREATE SCHEMA IF NOT EXISTS auth;

-- Mock authentication context functions
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS UUID AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- This will be overridden in tests using SET LOCAL
    current_user_id := current_setting('request.jwt.claims', true)::jsonb->>'sub';
    RETURN current_user_id;
EXCEPTION 
    WHEN OTHERS THEN 
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Dummy function to simulate Supabase's authentication context
CREATE OR REPLACE FUNCTION auth.jwt() 
RETURNS jsonb AS $$
BEGIN
    RETURN current_setting('request.jwt.claims', true)::jsonb;
EXCEPTION 
    WHEN OTHERS THEN 
        RETURN '{}'::jsonb;
END;
$$ LANGUAGE plpgsql;

-- Ensure auth schema tables exist
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    email_confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    raw_user_meta_data JSONB,
    encrypted_password TEXT,
    phone TEXT,
    last_sign_in_at TIMESTAMP WITH TIME ZONE
);

-- Ensure public schema tables exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    first_name TEXT,
    last_name TEXT,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'staff', 'user')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_invitations (
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

-- Create user invitation function
CREATE OR REPLACE FUNCTION create_user_invitation(
  invite_email TEXT,
  user_role TEXT DEFAULT 'staff',
  expires_in_hours INTEGER DEFAULT 72
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id UUID;
  v_invitation_token TEXT;
  v_invitation_id UUID;
  v_invitation_url TEXT;
  v_result JSONB;
  v_admin_user_id UUID;
  v_jwt_claims JSONB;
BEGIN
  -- Try to get current user ID from JWT claims
  BEGIN
    v_jwt_claims := current_setting('request.jwt.claims', true)::jsonb;
    current_user_id := v_jwt_claims->>'sub';
    
    -- Validate the user ID is a valid UUID
    IF current_user_id IS NULL OR current_user_id = '' THEN
      RAISE EXCEPTION 'Invalid or missing user ID in JWT claims';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
  END;
  
  -- If current_user_id is null, find an admin user
  IF current_user_id IS NULL THEN
    -- Try to find an existing admin user
    SELECT id INTO v_admin_user_id 
    FROM public.profiles 
    WHERE role = 'admin' 
    LIMIT 1;
    
    -- If no admin user exists, create a default admin user
    IF v_admin_user_id IS NULL THEN
      -- Create a default admin user in auth.users
      INSERT INTO auth.users (
        id, 
        email, 
        email_confirmed_at, 
        created_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000001',
        'system_admin@example.com',
        NOW(),
        NOW()
      ) ON CONFLICT (id) DO NOTHING;
      
      -- Create corresponding profile
      INSERT INTO public.profiles (
        id, 
        role, 
        first_name, 
        last_name,
        email
      ) VALUES (
        '00000000-0000-0000-0000-000000000001',
        'admin',
        'System',
        'Admin',
        'system_admin@example.com'
      ) ON CONFLICT (id) DO NOTHING;
      
      v_admin_user_id := '00000000-0000-0000-0000-000000000001';
    END IF;
    
    current_user_id := v_admin_user_id;
  END IF;
  
  -- Verify the user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = current_user_id AND role = 'admin'
  ) THEN
    DECLARE
      v_user_role TEXT;
    BEGIN
      -- Get the user's role
      SELECT role INTO v_user_role 
      FROM public.profiles 
      WHERE id = current_user_id;
      
      -- Raise an exception with the user's role
      RAISE EXCEPTION 'User % with role % is not an admin and cannot create invitations', 
        current_user_id, 
        COALESCE(v_user_role, 'unknown');
    END;
  END IF;
  
  -- Check if email already has an invitation
  IF EXISTS (
    SELECT 1 FROM public.user_invitations 
    WHERE email = invite_email AND status IN ('pending', 'sent')
  ) THEN
    RAISE EXCEPTION 'User already has a pending invitation';
  END IF;
  
  -- Check if user already exists
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE email = invite_email
  ) THEN
    RAISE EXCEPTION 'User already exists';
  END IF;
  
  -- Generate invitation token
  v_invitation_token := encode(gen_random_bytes(32), 'hex');
  
  -- Generate invitation URL
  v_invitation_url := 'http://127.0.0.1:5173/admin/invite?token=' || v_invitation_token;
  
  -- Create invitation
  INSERT INTO public.user_invitations (
    email, 
    invited_by, 
    role, 
    invitation_token, 
    invitation_url,
    expires_at,
    full_name,
    status
  ) VALUES (
    invite_email,
    current_user_id,
    user_role,
    v_invitation_token,
    v_invitation_url,
    NOW() + (expires_in_hours || ' hours')::INTERVAL,
    COALESCE(
      (SELECT first_name || ' ' || last_name 
       FROM public.profiles 
       WHERE id = current_user_id),
      'System Admin'
    ),
    'sent'
  ) RETURNING id INTO v_invitation_id;
  
  -- Return invitation details
  SELECT jsonb_build_object(
    'id', v_invitation_id,
    'email', invite_email,
    'role', user_role,
    'invitation_token', v_invitation_token,
    'invitation_url', v_invitation_url,
    'expires_at', ui.expires_at,
    'status', ui.status,
    'invited_by', ui.invited_by
  ) INTO v_result
  FROM public.user_invitations ui
  WHERE ui.id = v_invitation_id;
  
  RETURN v_result;
END;
$$; 