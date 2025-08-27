-- Add missing analytics_time_on_page table
-- This table is used by the frontend analytics tracking system for time tracking

CREATE TABLE IF NOT EXISTS analytics_time_on_page (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id text NOT NULL,
    page_url text NOT NULL,
    time_spent integer NOT NULL, -- time spent in seconds
    timestamp timestamp with time zone DEFAULT now(),
    user_id uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_time_on_page_session_id ON analytics_time_on_page(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_time_on_page_user_id ON analytics_time_on_page(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_time_on_page_timestamp ON analytics_time_on_page(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_time_on_page_page_url ON analytics_time_on_page(page_url);
CREATE INDEX IF NOT EXISTS idx_analytics_time_on_page_created_at ON analytics_time_on_page(created_at);

-- Enable RLS
ALTER TABLE analytics_time_on_page ENABLE ROW LEVEL SECURITY;

-- RLS policies to match the existing analytics tables pattern
-- Allow anonymous users to insert time tracking data (for tracking)
CREATE POLICY "Allow anonymous insert on analytics_time_on_page" 
ON analytics_time_on_page FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to insert time tracking data
CREATE POLICY "Allow authenticated insert on analytics_time_on_page" 
ON analytics_time_on_page FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Service role full access on analytics_time_on_page" 
ON analytics_time_on_page FOR ALL 
TO service_role
USING (true);

-- Allow admins to view analytics time on page data
CREATE POLICY "Admins can view analytics_time_on_page" 
ON analytics_time_on_page FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- Allow users to view their own time tracking data (if logged in)
CREATE POLICY "Users can view own analytics_time_on_page" 
ON analytics_time_on_page FOR SELECT 
USING (user_id = auth.uid());

-- Add table comment
COMMENT ON TABLE analytics_time_on_page IS 'Stores time spent on page events for Supabase Analytics tracking';
