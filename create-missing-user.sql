-- Create the missing user in auth.users table
-- This will trigger the profile creation automatically

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
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '8e17fbc4-26b2-419b-ba15-5d61a05a69ae',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'denniskiplangat.dk@gmail.com',
  crypt('temp-password-123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"full_name": "Dennis Kiplangat", "role": "admin"}',
  false,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Verify the user was created
SELECT 
  id,
  email,
  role,
  raw_user_meta_data,
  created_at
FROM auth.users 
WHERE id = '8e17fbc4-26b2-419b-ba15-5d61a05a69ae';

-- Check if profile was automatically created
SELECT 
  id,
  email,
  full_name,
  role,
  is_active,
  created_at
FROM public.profiles 
WHERE id = '8e17fbc4-26b2-419b-ba15-5d61a05a69ae';
