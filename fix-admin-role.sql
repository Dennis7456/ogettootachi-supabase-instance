-- Fix admin role for the user
-- This script will check the current user's role and update it to admin if needed

-- First, let's see what users we have and their roles
SELECT 
    id,
    email,
    role,
    full_name,
    created_at
FROM profiles
ORDER BY created_at DESC;

-- Update the user's role to admin (replace 'your-email@example.com' with the actual email)
UPDATE profiles 
SET role = 'admin'
WHERE email = 'denniskiplangat.dk@gmail.com'
AND role != 'admin';

-- Verify the update
SELECT 
    id,
    email,
    role,
    full_name
FROM profiles
WHERE email = 'denniskiplangat.dk@gmail.com';

-- Also check if there are any other admin users
SELECT 
    id,
    email,
    role,
    full_name
FROM profiles
WHERE role = 'admin';
