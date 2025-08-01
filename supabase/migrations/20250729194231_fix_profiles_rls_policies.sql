-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can do everything" ON profiles;

-- Create new, non-recursive policies for profiles table
-- Allow users to view their own profile (no recursion)
CREATE POLICY "Users can view own profile" ON profiles 
FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile (no recursion)
CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert their own profile (no recursion)
CREATE POLICY "Users can insert own profile" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to do everything (no recursion)
CREATE POLICY "Service role full access" ON profiles 
FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to view all profiles (for admin functionality)
-- This is needed for admin to view all profiles without recursion
CREATE POLICY "Authenticated users can view profiles" ON profiles 
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to update profiles (for admin functionality)
-- This is needed for admin to update profiles without recursion
CREATE POLICY "Authenticated users can update profiles" ON profiles 
FOR UPDATE USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON POLICY "Users can view own profile" ON profiles IS 'Allows users to view their own profile';
COMMENT ON POLICY "Users can update own profile" ON profiles IS 'Allows users to update their own profile';
COMMENT ON POLICY "Users can insert own profile" ON profiles IS 'Allows users to insert their own profile';
COMMENT ON POLICY "Service role full access" ON profiles IS 'Allows service role full access to profiles';
COMMENT ON POLICY "Authenticated users can view profiles" ON profiles IS 'Allows authenticated users to view profiles for admin functionality';
COMMENT ON POLICY "Authenticated users can update profiles" ON profiles IS 'Allows authenticated users to update profiles for admin functionality';
