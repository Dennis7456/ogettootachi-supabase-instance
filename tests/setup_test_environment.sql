-- Test Environment Setup

-- Ensure pgTAP is loaded
CREATE EXTENSION IF NOT EXISTS pgtap;

-- Create a schema for test utilities
CREATE SCHEMA IF NOT EXISTS test_utils;

-- Function to reset test data
CREATE OR REPLACE FUNCTION test_utils.reset_test_data()
RETURNS VOID AS $$
BEGIN
  -- Clear existing test data
  DELETE FROM user_invitations WHERE email LIKE 'test_%@example.com';
  DELETE FROM profiles WHERE email LIKE 'test_%@example.com';
  DELETE FROM auth.users WHERE email LIKE 'test_%@example.com';
END;
$$ LANGUAGE plpgsql;

-- Procedure to create a test admin user
CREATE OR REPLACE PROCEDURE test_utils.create_test_admin()
LANGUAGE plpgsql AS $$
DECLARE
  test_admin_id UUID;
BEGIN
  -- Create test admin user in auth.users
  INSERT INTO auth.users (
    id, 
    email, 
    email_confirmed_at, 
    created_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'test_admin@example.com',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- Create corresponding profile
  INSERT INTO profiles (
    id, 
    role, 
    first_name, 
    last_name,
    email
  ) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'Test',
    'Admin',
    'test_admin@example.com'
  ) ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Ensure test admin is created
CALL test_utils.create_test_admin();

-- Grant necessary permissions for testing
GRANT ALL ON SCHEMA test_utils TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA test_utils TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA test_utils TO postgres; 