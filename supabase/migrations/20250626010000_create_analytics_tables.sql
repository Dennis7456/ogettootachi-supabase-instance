-- Create analytics tables for tracking user behavior
-- This migration adds tables for page views, conversions, time on page, and chatbot interactions

-- Analytics page views table
CREATE TABLE IF NOT EXISTS analytics_pageviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  page_title TEXT,
  referrer TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics time on page table
CREATE TABLE IF NOT EXISTS analytics_time_on_page (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  time_spent INTEGER NOT NULL, -- seconds
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics conversions table
CREATE TABLE IF NOT EXISTS analytics_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  page_url TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics chatbot interactions table
CREATE TABLE IF NOT EXISTS analytics_chatbot (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  message_count INTEGER DEFAULT 0,
  conversation_duration INTEGER DEFAULT 0, -- seconds
  topics TEXT,
  page_url TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_session_id ON analytics_pageviews(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_timestamp ON analytics_pageviews(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_page_url ON analytics_pageviews(page_url);

CREATE INDEX IF NOT EXISTS idx_analytics_time_on_page_session_id ON analytics_time_on_page(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_time_on_page_timestamp ON analytics_time_on_page(timestamp);

CREATE INDEX IF NOT EXISTS idx_analytics_conversions_session_id ON analytics_conversions(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_conversions_event_type ON analytics_conversions(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_conversions_timestamp ON analytics_conversions(timestamp);

CREATE INDEX IF NOT EXISTS idx_analytics_chatbot_session_id ON analytics_chatbot(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_chatbot_timestamp ON analytics_chatbot(timestamp);

-- Enable RLS (Row Level Security)
ALTER TABLE analytics_pageviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_time_on_page ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_chatbot ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Analytics are insertable by anyone" ON analytics_pageviews;
DROP POLICY IF EXISTS "Analytics are viewable by admins" ON analytics_pageviews;
DROP POLICY IF EXISTS "Analytics are insertable by anyone" ON analytics_time_on_page;
DROP POLICY IF EXISTS "Analytics are viewable by admins" ON analytics_time_on_page;
DROP POLICY IF EXISTS "Analytics are insertable by anyone" ON analytics_conversions;
DROP POLICY IF EXISTS "Analytics are viewable by admins" ON analytics_conversions;
DROP POLICY IF EXISTS "Analytics are insertable by anyone" ON analytics_chatbot;
DROP POLICY IF EXISTS "Analytics are viewable by admins" ON analytics_chatbot;

-- RLS Policies for analytics tables
-- Allow anyone to insert analytics data (for tracking)
CREATE POLICY "Analytics are insertable by anyone" ON analytics_pageviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Analytics are insertable by anyone" ON analytics_time_on_page
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Analytics are insertable by anyone" ON analytics_conversions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Analytics are insertable by anyone" ON analytics_chatbot
  FOR INSERT WITH CHECK (true);

-- Only admins can view analytics data
CREATE POLICY "Analytics are viewable by admins" ON analytics_pageviews
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Analytics are viewable by admins" ON analytics_time_on_page
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Analytics are viewable by admins" ON analytics_conversions
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Analytics are viewable by admins" ON analytics_chatbot
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Function to get analytics dashboard data
CREATE OR REPLACE FUNCTION get_analytics_dashboard(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'pageviews', (
      SELECT COUNT(*) 
      FROM analytics_pageviews 
      WHERE timestamp BETWEEN start_date AND end_date
    ),
    'conversions', (
      SELECT COUNT(*) 
      FROM analytics_conversions 
      WHERE timestamp BETWEEN start_date AND end_date
    ),
    'totalTime', (
      SELECT COALESCE(SUM(time_spent), 0) 
      FROM analytics_time_on_page 
      WHERE timestamp BETWEEN start_date AND end_date
    ),
    'uniqueSessions', (
      SELECT COUNT(DISTINCT session_id) 
      FROM analytics_pageviews 
      WHERE timestamp BETWEEN start_date AND end_date
    ),
    'topPages', (
      SELECT jsonb_agg(jsonb_build_object(
        'page_url', page_url,
        'page_title', page_title,
        'count', count
      ))
      FROM (
        SELECT page_url, page_title, COUNT(*) as count
        FROM analytics_pageviews
        WHERE timestamp BETWEEN start_date AND end_date
        GROUP BY page_url, page_title
        ORDER BY count DESC
        LIMIT 10
      ) top_pages
    ),
    'topConversions', (
      SELECT jsonb_agg(jsonb_build_object(
        'event_type', event_type,
        'count', count
      ))
      FROM (
        SELECT event_type, COUNT(*) as count
        FROM analytics_conversions
        WHERE timestamp BETWEEN start_date AND end_date
        GROUP BY event_type
        ORDER BY count DESC
        LIMIT 10
      ) top_conversions
    ),
    'chatbotStats', (
      SELECT jsonb_build_object(
        'totalInteractions', COUNT(*),
        'avgMessages', AVG(message_count),
        'avgDuration', AVG(conversation_duration)
      )
      FROM analytics_chatbot
      WHERE timestamp BETWEEN start_date AND end_date
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Function to get real-time analytics
CREATE OR REPLACE FUNCTION get_real_time_analytics()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'activeSessions', (
      SELECT COUNT(DISTINCT session_id)
      FROM analytics_pageviews
      WHERE timestamp > NOW() - INTERVAL '30 minutes'
    ),
    'pageViewsLastHour', (
      SELECT COUNT(*)
      FROM analytics_pageviews
      WHERE timestamp > NOW() - INTERVAL '1 hour'
    ),
    'conversionsLastHour', (
      SELECT COUNT(*)
      FROM analytics_conversions
      WHERE timestamp > NOW() - INTERVAL '1 hour'
    ),
    'recentActivity', (
      SELECT jsonb_agg(jsonb_build_object(
        'type', 'pageview',
        'page_url', page_url,
        'page_title', page_title,
        'timestamp', timestamp
      ))
      FROM (
        SELECT page_url, page_title, timestamp
        FROM analytics_pageviews
        WHERE timestamp > NOW() - INTERVAL '1 hour'
        ORDER BY timestamp DESC
        LIMIT 10
      ) recent_pageviews
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_analytics_dashboard(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO service_role;
GRANT EXECUTE ON FUNCTION get_analytics_dashboard(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_real_time_analytics() TO service_role;
GRANT EXECUTE ON FUNCTION get_real_time_analytics() TO authenticated; 