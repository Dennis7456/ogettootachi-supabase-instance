-- Create job analytics tables for tracking views, conversions, and performance metrics
-- This will provide comprehensive analytics for job postings and applications

-- Job Views Table - Track individual job posting views
CREATE TABLE IF NOT EXISTS job_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  viewer_ip VARCHAR(45), -- IPv4 or IPv6
  viewer_user_agent TEXT,
  viewer_referrer TEXT,
  session_id VARCHAR(255),
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Application Events Table - Track application funnel events
CREATE TABLE IF NOT EXISTS job_application_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'view', 'apply_click', 'form_start', 'form_complete', 
    'file_upload', 'submission', 'admin_review', 'status_update'
  )),
  event_data JSONB, -- Store additional event data
  user_ip VARCHAR(45),
  user_agent TEXT,
  session_id VARCHAR(255),
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job Performance Metrics Table - Aggregated metrics for reporting
CREATE TABLE IF NOT EXISTS job_performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN (
    'views', 'unique_views', 'applications', 'conversion_rate',
    'avg_time_on_page', 'bounce_rate', 'source_traffic'
  )),
  metric_value DECIMAL(10,4),
  metric_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(job_id, metric_date, metric_type)
);

-- Job Source Tracking Table - Track where applications come from
CREATE TABLE IF NOT EXISTS job_source_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN (
    'direct', 'search', 'social', 'referral', 'email', 'internal'
  )),
  source_name VARCHAR(100), -- e.g., 'google', 'linkedin', 'facebook'
  campaign_name VARCHAR(100),
  utm_source VARCHAR(100),
  utm_medium VARCHAR(100),
  utm_campaign VARCHAR(100),
  utm_term VARCHAR(100),
  utm_content VARCHAR(100),
  first_touch_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_touch_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_views_job_id ON job_views(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_viewed_at ON job_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_job_views_session_id ON job_views(session_id);

CREATE INDEX IF NOT EXISTS idx_job_application_events_job_id ON job_application_events(job_id);
CREATE INDEX IF NOT EXISTS idx_job_application_events_event_type ON job_application_events(event_type);
CREATE INDEX IF NOT EXISTS idx_job_application_events_occurred_at ON job_application_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_job_application_events_session_id ON job_application_events(session_id);

CREATE INDEX IF NOT EXISTS idx_job_performance_metrics_job_id ON job_performance_metrics(job_id);
CREATE INDEX IF NOT EXISTS idx_job_performance_metrics_metric_date ON job_performance_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_job_performance_metrics_type ON job_performance_metrics(metric_type);

CREATE INDEX IF NOT EXISTS idx_job_source_tracking_job_id ON job_source_tracking(job_id);
CREATE INDEX IF NOT EXISTS idx_job_source_tracking_source_type ON job_source_tracking(source_type);
CREATE INDEX IF NOT EXISTS idx_job_source_tracking_first_touch ON job_source_tracking(first_touch_at);

-- Enable RLS
ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_application_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_source_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for job_views
CREATE POLICY "Public can insert job views" 
ON job_views FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin/staff can view job analytics" 
ON job_views FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff')
  )
);

-- Create RLS policies for job_application_events
CREATE POLICY "Public can insert application events" 
ON job_application_events FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin/staff can view application events" 
ON job_application_events FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff')
  )
);

-- Create RLS policies for job_performance_metrics
CREATE POLICY "Admin/staff can manage performance metrics" 
ON job_performance_metrics FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff')
  )
);

-- Create RLS policies for job_source_tracking
CREATE POLICY "Public can insert source tracking" 
ON job_source_tracking FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin/staff can view source tracking" 
ON job_source_tracking FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff')
  )
);

-- Grant permissions
GRANT ALL ON job_views TO authenticated;
GRANT ALL ON job_views TO service_role;
GRANT ALL ON job_application_events TO authenticated;
GRANT ALL ON job_application_events TO service_role;
GRANT ALL ON job_performance_metrics TO authenticated;
GRANT ALL ON job_performance_metrics TO service_role;
GRANT ALL ON job_source_tracking TO authenticated;
GRANT ALL ON job_source_tracking TO service_role; 