-- Enable Row Level Security on appointments table
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.appointments;
DROP POLICY IF EXISTS "Enable all access for service role" ON public.appointments;

-- 1. Admin can do everything
CREATE POLICY "Admins have full access to appointments" 
ON public.appointments
FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM auth.users 
  WHERE id = auth.uid() 
  AND raw_user_meta_data->>'role' = 'admin'
));

-- 2. Staff can view their assigned appointments
CREATE POLICY "Staff can view their appointments" 
ON public.appointments
FOR SELECT
TO authenticated
USING (
  assigned_to = auth.uid() 
  OR assigned_to IS NULL
  OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- 3. Staff can update their assigned appointments
CREATE POLICY "Staff can update their appointments" 
ON public.appointments
FOR UPDATE
TO authenticated
USING (
  assigned_to = auth.uid()
  OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
)
WITH CHECK (
  assigned_to = auth.uid()
  OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' = 'admin'
  )
);

-- 4. Allow authenticated users to create appointments (for the booking form)
CREATE POLICY "Allow authenticated users to create appointments"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. Allow users to view their own appointments (for clients)
CREATE POLICY "Users can view their own appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  client_email IN (
    SELECT email 
    FROM auth.users 
    WHERE id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND raw_user_meta_data->>'role' IN ('admin', 'staff')
  )
);

-- 6. Service role can still access everything (for server-side operations)
CREATE POLICY "Service role can access all appointments"
ON public.appointments
FOR ALL
TO service_role
USING (true);

-- Add comments for documentation
COMMENT ON POLICY "Admins have full access to appointments" ON public.appointments IS 'Allows admins full CRUD access to all appointments';
COMMENT ON POLICY "Staff can view their appointments" ON public.appointments IS 'Allows staff to view their assigned appointments';
COMMENT ON POLICY "Staff can update their appointments" ON public.appointments IS 'Allows staff to update their assigned appointments';
COMMENT ON POLICY "Allow authenticated users to create appointments" ON public.appointments IS 'Allows any authenticated user to create a new appointment';
COMMENT ON POLICY "Users can view their own appointments" ON public.appointments IS 'Allows users to view their own appointments';
COMMENT ON POLICY "Service role can access all appointments" ON public.appointments IS 'Allows service role to access all appointments for server-side operations';
