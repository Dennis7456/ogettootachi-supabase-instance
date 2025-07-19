-- Setup Supabase schema for testing

-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users table
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

-- Create profiles table
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

-- Create user_invitations table
CREATE TABLE IF NOT EXISTS public.user_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    invited_by UUID REFERENCES auth.users(id) NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'user')),
    invitation_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    full_name TEXT,
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'sent', 'accepted', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON public.user_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expires ON public.user_invitations(expires_at);

-- Mock authentication context function
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