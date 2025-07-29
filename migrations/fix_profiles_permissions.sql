-- Grant necessary permissions to the authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Users can read their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can do everything" ON profiles;

-- Create simplified policies

-- Allow anyone to insert profiles
CREATE POLICY "Enable insert for everyone"
ON profiles FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow users to read their own profile
CREATE POLICY "Enable select for users"
ON profiles FOR SELECT
USING (true);

-- Allow users to update their own profile
CREATE POLICY "Enable update for users"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow users to delete their own profile
CREATE POLICY "Enable delete for users"
ON profiles FOR DELETE
USING (id = auth.uid()); 