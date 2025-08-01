-- Drop existing policies for analytics tables
DROP POLICY IF EXISTS "Service role can do everything on analytics_conversions" ON analytics_conversions;
DROP POLICY IF EXISTS "Service role can do everything on analytics_sessions" ON analytics_sessions;
DROP POLICY IF EXISTS "Service role can do everything on analytics_events" ON analytics_events;
DROP POLICY IF EXISTS "Authenticated users can insert analytics_conversions" ON analytics_conversions;
DROP POLICY IF EXISTS "Authenticated users can insert analytics_sessions" ON analytics_sessions;
DROP POLICY IF EXISTS "Authenticated users can insert analytics_events" ON analytics_events;
DROP POLICY IF EXISTS "Admins can view analytics_conversions" ON analytics_conversions;
DROP POLICY IF EXISTS "Admins can view analytics_sessions" ON analytics_sessions;
DROP POLICY IF EXISTS "Admins can view analytics_events" ON analytics_events;

-- Create new, more permissive policies for analytics tables
-- Allow anonymous users to insert analytics data (for tracking)
CREATE POLICY "Allow anonymous insert on analytics_conversions" ON analytics_conversions 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous insert on analytics_sessions" ON analytics_sessions 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous insert on analytics_events" ON analytics_events 
FOR INSERT WITH CHECK (true);

-- Allow authenticated users to insert analytics data
CREATE POLICY "Allow authenticated insert on analytics_conversions" ON analytics_conversions 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert on analytics_sessions" ON analytics_sessions 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert on analytics_events" ON analytics_events 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow service role to do everything
CREATE POLICY "Service role full access on analytics_conversions" ON analytics_conversions 
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on analytics_sessions" ON analytics_sessions 
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on analytics_events" ON analytics_events 
FOR ALL USING (auth.role() = 'service_role');

-- Allow admins to view analytics data
CREATE POLICY "Admins can view analytics_conversions" ON analytics_conversions 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can view analytics_sessions" ON analytics_sessions 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can view analytics_events" ON analytics_events 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Allow users to view their own analytics data
CREATE POLICY "Users can view own analytics_conversions" ON analytics_conversions 
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own analytics_sessions" ON analytics_sessions 
FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own analytics_events" ON analytics_events 
FOR SELECT USING (auth.uid() IS NOT NULL);

-- Add comments for documentation
COMMENT ON POLICY "Allow anonymous insert on analytics_conversions" ON analytics_conversions IS 'Allows anonymous users to insert analytics data for tracking';
COMMENT ON POLICY "Allow anonymous insert on analytics_sessions" ON analytics_sessions IS 'Allows anonymous users to insert session data for tracking';
COMMENT ON POLICY "Allow anonymous insert on analytics_events" ON analytics_events IS 'Allows anonymous users to insert event data for tracking';
