-- Manual Email Confirmation Script
-- Run this script to manually confirm a user's email address

-- Replace 'your-email@example.com' with the actual email address
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    updated_at = NOW()
WHERE email = 'your-email@example.com';

-- Verify the update
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'your-email@example.com'; 