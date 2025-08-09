-- Check appointments table structure
-- Run this in your Supabase SQL editor

-- Check if appointment_type column exists
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check current RLS policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'appointments' 
AND schemaname = 'public';

-- Check if there are any existing appointments
SELECT COUNT(*) as total_appointments FROM public.appointments;

-- Check sample appointment data (if any exist)
SELECT * FROM public.appointments LIMIT 1;
