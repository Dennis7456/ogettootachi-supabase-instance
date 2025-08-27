-- Create profile for existing admin user who is missing their profile
INSERT INTO public.profiles (id, email, full_name, role, is_active, created_at, updated_at)
VALUES (
  '8e17fbc4-26b2-419b-ba15-5d61a05a69ae',
  'denniskiplangat.dk@gmail.com',
  'Dennis Kiplangat',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE public.profiles IS 'User profiles table - automatically populated when users are created';
