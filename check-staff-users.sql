-- Check for existing staff and admin users
-- Run this in your Supabase SQL editor

-- Check profiles table for staff and admin users
SELECT 
    id,
    full_name,
    email,
    role,
    is_active,
    created_at
FROM profiles 
WHERE role IN ('staff', 'admin')
ORDER BY created_at DESC;

-- Check auth.users table for confirmed users
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL
ORDER BY created_at DESC;

-- Check if there are any users at all
SELECT COUNT(*) as total_profiles FROM profiles;
SELECT COUNT(*) as total_auth_users FROM auth.users;
