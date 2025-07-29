-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for anonymous users" ON appointments;
DROP POLICY IF EXISTS "Enable select for authenticated users" ON appointments;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON appointments;

-- Create more permissive policies
-- Allow anyone to insert appointments
CREATE POLICY "Anyone can insert appointments"
ON appointments FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anyone to select appointments
CREATE POLICY "Anyone can select appointments"
ON appointments FOR SELECT
USING (true);

-- Allow authenticated users to update appointments
CREATE POLICY "Authenticated users can update appointments"
ON appointments FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true); 