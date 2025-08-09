-- Fix public appointment booking by allowing anonymous users to insert appointments
-- This migration addresses the issue where anonymous users can't book appointments

-- Drop the restrictive INSERT policy that only allows admins/staff
DROP POLICY IF EXISTS "Admins and staff can create appointments" ON appointments;

-- Create a new policy that allows anonymous users to insert appointments
-- This is necessary for the public booking form
CREATE POLICY "Allow public appointment booking"
ON appointments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Keep the existing policies for other operations
-- (SELECT, UPDATE, DELETE policies remain unchanged)

-- Add a comment to document this policy
COMMENT ON POLICY "Allow public appointment booking" ON appointments IS 
'Allows anonymous and authenticated users to book appointments through the public form. This is necessary for client self-service booking.';
