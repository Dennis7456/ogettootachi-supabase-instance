-- Drop the existing policy that's not working
DROP POLICY IF EXISTS "Allow anonymous users to insert analytics" ON analytics_pageviews;

-- Create a new, more permissive policy for anonymous inserts
CREATE POLICY "Enable insert for anonymous users" 
ON analytics_pageviews FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Create a policy to allow everyone to select
CREATE POLICY "Enable select for all users" 
ON analytics_pageviews FOR SELECT 
USING (true); 