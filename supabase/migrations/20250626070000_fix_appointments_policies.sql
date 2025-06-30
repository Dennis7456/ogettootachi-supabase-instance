-- Drop the problematic policy that references auth.users
DROP POLICY IF EXISTS "Users can view own appointments" ON appointments;

-- Create a simple policy that allows admins and staff to view all appointments
CREATE POLICY "Admins and staff can view all appointments" ON appointments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'staff')
    )
  ); 