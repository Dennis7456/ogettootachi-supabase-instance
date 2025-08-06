-- Enable RLS on appointments table if not already enabled
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public insert on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow users to read their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow users to update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow service role full access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow authenticated users to read all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow authenticated users to update all appointments" ON public.appointments;

-- Allow public users to insert appointments (for appointment booking form)
CREATE POLICY "Allow public insert on appointments"
ON public.appointments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow users to read their own appointments (by email)
CREATE POLICY "Allow users to read their own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  client_email IN (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
);

-- Allow staff to read all appointments
CREATE POLICY "Allow staff to read all appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role = 'staff' OR role = 'admin')
  )
);

-- Allow users to update their own appointments (by email)
CREATE POLICY "Allow users to update their own appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  client_email IN (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
)
WITH CHECK (
  client_email IN (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
);

-- Allow staff to update any appointment (for assigning staff, updating status, etc.)
CREATE POLICY "Allow staff to update any appointment"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role = 'staff' OR role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role = 'staff' OR role = 'admin')
  )
);

-- Allow staff to assign themselves or other staff to appointments
CREATE POLICY "Allow staff to assign appointments"
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role = 'staff' OR role = 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND (role = 'staff' OR role = 'admin')
  )
  -- Allow assigning to any staff member or leaving unassigned (NULL)
  AND (
    assigned_to IS NULL 
    OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = assigned_to AND (role = 'staff' OR role = 'admin')
    )
  )
);

-- Allow service role (admin) to do everything
CREATE POLICY "Allow service role full access to appointments"
ON public.appointments
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Function to check if user is staff
CREATE OR REPLACE FUNCTION is_staff()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'staff'
  );
$$ LANGUAGE sql SECURITY DEFINER;
