-- Drop existing policies that might be causing recursion
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can do everything" ON profiles;

-- Create new policies without recursion

-- Allow anyone to insert profiles (needed for signup)
CREATE POLICY "Anyone can insert profiles"
ON profiles FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow users to read their own profile
CREATE POLICY "Users can read their own profile" 
ON profiles FOR SELECT 
TO authenticated
USING (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow service role to do everything
CREATE POLICY "Service role can do everything" 
ON profiles 
TO service_role
USING (true)
WITH CHECK (true);

-- Create a separate policy for admin users to read all profiles
-- This avoids the recursion by not checking the profiles table itself
CREATE POLICY "Admins can read all profiles" 
ON profiles FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid() 
        AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
);

-- Create a separate policy for admin users to update all profiles
-- This avoids the recursion by not checking the profiles table itself
CREATE POLICY "Admins can update all profiles" 
ON profiles FOR UPDATE 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid() 
        AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid() 
        AND (auth.users.raw_user_meta_data->>'role')::text = 'admin'
    )
); 