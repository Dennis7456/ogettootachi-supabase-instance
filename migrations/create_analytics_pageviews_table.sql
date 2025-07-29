-- Create analytics_pageviews table
CREATE TABLE IF NOT EXISTS analytics_pageviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    page_url TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    timestamp TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id),
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies
ALTER TABLE analytics_pageviews ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert analytics
CREATE POLICY "Allow anonymous users to insert analytics" 
ON analytics_pageviews FOR INSERT 
TO anon
WITH CHECK (true);

-- Allow authenticated users to view their own analytics
CREATE POLICY "Allow users to view their own analytics" 
ON analytics_pageviews FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Allow service role to do everything
CREATE POLICY "Allow service role full access" 
ON analytics_pageviews 
TO service_role
USING (true)
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS analytics_pageviews_session_id_idx ON analytics_pageviews(session_id);
CREATE INDEX IF NOT EXISTS analytics_pageviews_user_id_idx ON analytics_pageviews(user_id);
CREATE INDEX IF NOT EXISTS analytics_pageviews_timestamp_idx ON analytics_pageviews(timestamp); 