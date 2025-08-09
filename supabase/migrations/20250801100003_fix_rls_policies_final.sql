-- Final fix for appointments RLS policies
-- This ensures anonymous users can book appointments

-- First, disable RLS temporarily to clear all policies
ALTER TABLE public.appointments DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Allow public appointment booking" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can insert appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can select appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Service role has full access" ON public.appointments;
DROP POLICY IF EXISTS "Admins and staff can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Authenticated users can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins and staff can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;

-- Create the correct policies for public appointment booking
-- 1. Allow anyone (anonymous and authenticated) to insert appointments
CREATE POLICY "Allow public appointment booking"
ON public.appointments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 2. Allow authenticated users to view appointments
CREATE POLICY "Authenticated users can view appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (true);

-- 3. Allow authenticated users to update appointments
CREATE POLICY "Authenticated users can update appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Allow service role full access (for admin operations)
CREATE POLICY "Service role has full access"
ON public.appointments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add comments for documentation
COMMENT ON POLICY "Allow public appointment booking" ON public.appointments IS 
'Allows anonymous and authenticated users to book appointments through the public form';

COMMENT ON POLICY "Authenticated users can view appointments" ON public.appointments IS 
'Allows authenticated users to view all appointments';

COMMENT ON POLICY "Authenticated users can update appointments" ON public.appointments IS 
'Allows authenticated users to update appointments';

COMMENT ON POLICY "Service role has full access" ON public.appointments IS 
'Allows service role to perform all operations for admin functions';
