-- Add staff user to profiles table
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
