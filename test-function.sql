-- Test script to check the current get_pending_invitations function
-- This will help us understand why we're getting a 400 error

-- 1. Check if the function exists and its signature
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_pending_invitations'
AND n.nspname = 'public';

-- 2. Check if the user_invitations table has the required columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_invitations'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if there are any pending invitations
SELECT COUNT(*) as pending_invitations_count
FROM user_invitations
WHERE accepted_at IS NULL
AND expires_at > NOW();

-- 4. Test the function directly (this might fail, but will show the exact error)
-- Note: This will only work if you're authenticated as an admin
SELECT * FROM get_pending_invitations();

-- 5. Check RLS policies on user_invitations table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_invitations'; 