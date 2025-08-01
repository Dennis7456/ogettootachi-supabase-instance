-- Create analytics_conversions table for Supabase Analytics
CREATE TABLE IF NOT EXISTS analytics_conversions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id text,
    event_type text,
    event_data jsonb,
    page_url text,
    timestamp timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- Create analytics_sessions table
CREATE TABLE IF NOT EXISTS analytics_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id text UNIQUE,
    user_id uuid REFERENCES auth.users(id),
    started_at timestamp with time zone DEFAULT now(),
    ended_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS analytics_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id text,
    event_name text,
    event_data jsonb,
    page_url text,
    timestamp timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_conversions_session_id ON analytics_conversions(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_conversions_timestamp ON analytics_conversions(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_conversions_event_type ON analytics_conversions(event_type);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_session_id ON analytics_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON analytics_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);

-- Enable RLS on analytics tables
ALTER TABLE analytics_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for analytics tables
-- Allow service role to do everything
CREATE POLICY "Service role can do everything on analytics_conversions" ON analytics_conversions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do everything on analytics_sessions" ON analytics_sessions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do everything on analytics_events" ON analytics_events FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to insert analytics data
CREATE POLICY "Authenticated users can insert analytics_conversions" ON analytics_conversions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert analytics_sessions" ON analytics_sessions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert analytics_events" ON analytics_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow admins to view analytics data
CREATE POLICY "Admins can view analytics_conversions" ON analytics_conversions FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can view analytics_sessions" ON analytics_sessions FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can view analytics_events" ON analytics_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Add comments for documentation
COMMENT ON TABLE analytics_conversions IS 'Stores conversion events for Supabase Analytics';
COMMENT ON TABLE analytics_sessions IS 'Stores user sessions for Supabase Analytics';
COMMENT ON TABLE analytics_events IS 'Stores general events for Supabase Analytics';
