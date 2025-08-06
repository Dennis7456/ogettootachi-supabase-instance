-- Add missing analytics_pageviews table
-- This table is used by the frontend analytics tracking system

CREATE TABLE IF NOT EXISTS analytics_pageviews (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id text NOT NULL,
    page_url text NOT NULL,
    page_title text,
    referrer text,
    timestamp timestamp with time zone DEFAULT now(),
    user_id uuid REFERENCES auth.users(id),
    user_agent text,
    ip_address text,
    created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_session_id ON analytics_pageviews(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_user_id ON analytics_pageviews(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_timestamp ON analytics_pageviews(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_page_url ON analytics_pageviews(page_url);
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_created_at ON analytics_pageviews(created_at);

-- Enable RLS
ALTER TABLE analytics_pageviews ENABLE ROW LEVEL SECURITY;

-- RLS policies to match the existing analytics tables pattern
-- Allow anonymous users to insert pageviews (for tracking)
CREATE POLICY "Allow anonymous insert on analytics_pageviews" 
ON analytics_pageviews FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to insert pageviews
CREATE POLICY "Allow authenticated insert on analytics_pageviews" 
ON analytics_pageviews FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow service role full access
CREATE POLICY "Service role full access on analytics_pageviews" 
ON analytics_pageviews FOR ALL 
TO service_role
USING (true);

-- Allow admins to view analytics pageviews
CREATE POLICY "Admins can view analytics_pageviews" 
ON analytics_pageviews FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- Allow users to view their own pageviews (if logged in)
CREATE POLICY "Users can view own analytics_pageviews" 
ON analytics_pageviews FOR SELECT 
USING (user_id = auth.uid());

-- Add table comment
COMMENT ON TABLE analytics_pageviews IS 'Stores page view events for Supabase Analytics tracking';