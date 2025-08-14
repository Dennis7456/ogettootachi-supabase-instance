-- Create user in auth.users table
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  'c19b7313-82fe-4f60-a003-bd82715608bd',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'webmastaz2019@gmail.com',
  crypt('staff123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- Add user to profiles table
INSERT INTO profiles (id, email, role, is_active, full_name, created_at, updated_at)
VALUES (
  'c19b7313-82fe-4f60-a003-bd82715608bd',
  'webmastaz2019@gmail.com',
  'staff',
  true,
  'Staff User',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();
