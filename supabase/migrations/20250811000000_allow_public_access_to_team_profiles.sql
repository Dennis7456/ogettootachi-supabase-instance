-- Allow public access to view active staff profiles for the team page
-- This policy allows anyone (including unauthenticated users) to view active staff profiles
CREATE POLICY "Public can view active staff profiles" ON profiles 
FOR SELECT USING (
  role = 'staff' AND 
  is_active = true
);

-- Add comment for documentation
COMMENT ON POLICY "Public can view active staff profiles" ON profiles IS 'Allows public access to view active staff profiles for the team page';
