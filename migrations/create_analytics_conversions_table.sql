-- Create analytics_conversions table
CREATE TABLE IF NOT EXISTS analytics_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    page_url TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies
ALTER TABLE analytics_conversions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert conversions
CREATE POLICY "Enable insert for anonymous users" 
ON analytics_conversions FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Allow everyone to select
CREATE POLICY "Enable select for all users" 
ON analytics_conversions FOR SELECT 
USING (true);

-- Allow service role to do everything
CREATE POLICY "Service role can do everything" 
ON analytics_conversions 
TO service_role
USING (true)
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS analytics_conversions_session_id_idx ON analytics_conversions(session_id);
CREATE INDEX IF NOT EXISTS analytics_conversions_event_type_idx ON analytics_conversions(event_type);
CREATE INDEX IF NOT EXISTS analytics_conversions_timestamp_idx ON analytics_conversions(timestamp); 