-- Migration: Fix RLS policies for practice_areas table
-- This allows anonymous users to read active practice areas

-- Enable RLS on practice_areas table if not already enabled
ALTER TABLE practice_areas ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous read of active practice areas" ON practice_areas;
DROP POLICY IF EXISTS "Allow public read of practice areas" ON practice_areas;
DROP POLICY IF EXISTS "Enable read access for all users" ON practice_areas;

-- Create a policy that allows anonymous and authenticated users to read active practice areas
CREATE POLICY "Allow anonymous read of active practice areas" 
ON practice_areas 
FOR SELECT 
TO anon, authenticated 
USING (is_active = true);

-- Create a policy that allows authenticated users to manage practice areas (for admin/staff)
CREATE POLICY "Allow authenticated users to manage practice areas" 
ON practice_areas 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Add a comment to document the policies
COMMENT ON POLICY "Allow anonymous read of active practice areas" ON practice_areas IS 
'Allows anonymous and authenticated users to read practice areas where is_active = true';

COMMENT ON POLICY "Allow authenticated users to manage practice areas" ON practice_areas IS 
'Allows authenticated users (admin/staff) to perform all operations on practice areas';
