-- Create functions for job analytics tracking and reporting
-- These functions will handle analytics data collection and reporting

-- Function to track job view
CREATE OR REPLACE FUNCTION track_job_view(
  job_id UUID,
  viewer_ip VARCHAR(45) DEFAULT NULL,
  viewer_user_agent TEXT DEFAULT NULL,
  viewer_referrer TEXT DEFAULT NULL,
  session_id VARCHAR(255) DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO job_views (
    job_id,
    viewer_ip,
    viewer_user_agent,
    viewer_referrer,
    session_id
  ) VALUES (
    job_id,
    viewer_ip,
    viewer_user_agent,
    viewer_referrer,
    session_id
  );
  
  -- Update job posting views count
  UPDATE job_postings 
  SET views_count = views_count + 1 
  WHERE id = job_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track application event
CREATE OR REPLACE FUNCTION track_application_event(
  job_id UUID,
  event_type VARCHAR(50),
  application_id UUID DEFAULT NULL,
  event_data JSONB DEFAULT NULL,
  user_ip VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  session_id VARCHAR(255) DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO job_application_events (
    job_id,
    application_id,
    event_type,
    event_data,
    user_ip,
    user_agent,
    session_id
  ) VALUES (
    job_id,
    application_id,
    event_type,
    event_data,
    user_ip,
    user_agent,
    session_id
  );
  
  -- Update applications count for submission events
  IF event_type = 'submission' THEN
    UPDATE job_postings 
    SET applications_count = applications_count + 1 
    WHERE id = job_id;
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track source attribution
CREATE OR REPLACE FUNCTION track_job_source(
  job_id UUID,
  application_id UUID,
  source_type VARCHAR(50),
  source_name VARCHAR(100) DEFAULT NULL,
  campaign_name VARCHAR(100) DEFAULT NULL,
  utm_source VARCHAR(100) DEFAULT NULL,
  utm_medium VARCHAR(100) DEFAULT NULL,
  utm_campaign VARCHAR(100) DEFAULT NULL,
  utm_term VARCHAR(100) DEFAULT NULL,
  utm_content VARCHAR(100) DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO job_source_tracking (
    job_id,
    application_id,
    source_type,
    source_name,
    campaign_name,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content
  ) VALUES (
    job_id,
    application_id,
    source_type,
    source_name,
    campaign_name,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get job analytics summary
CREATE OR REPLACE FUNCTION get_job_analytics_summary(
  job_id UUID,
  days_back INTEGER DEFAULT 30
) RETURNS TABLE (
  total_views BIGINT,
  unique_views BIGINT,
  total_applications BIGINT,
  conversion_rate DECIMAL(5,2),
  avg_time_on_page DECIMAL(10,2),
  top_sources JSONB,
  recent_activity JSONB
) AS $$
DECLARE
  start_date TIMESTAMP WITH TIME ZONE;
BEGIN
  start_date := NOW() - INTERVAL '1 day' * days_back;
  
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT jv.id) as total_views,
    COUNT(DISTINCT jv.session_id) as unique_views,
    COUNT(DISTINCT ja.id) as total_applications,
    CASE 
      WHEN COUNT(DISTINCT jv.session_id) > 0 
      THEN ROUND((COUNT(DISTINCT ja.id)::DECIMAL / COUNT(DISTINCT jv.session_id) * 100), 2)
      ELSE 0 
    END as conversion_rate,
    AVG(EXTRACT(EPOCH FROM (jae.occurred_at - jv.viewed_at))) as avg_time_on_page,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'source_type', jst.source_type,
          'source_name', jst.source_name,
          'count', count(*)
        )
      )
      FROM job_source_tracking jst
      WHERE jst.job_id = get_job_analytics_summary.job_id
      AND jst.first_touch_at >= start_date
      GROUP BY jst.source_type, jst.source_name
      ORDER BY count(*) DESC
      LIMIT 5
    ) as top_sources,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'event_type', jae.event_type,
          'occurred_at', jae.occurred_at,
          'session_id', jae.session_id
        )
      )
      FROM job_application_events jae
      WHERE jae.job_id = get_job_analytics_summary.job_id
      AND jae.occurred_at >= start_date
      ORDER BY jae.occurred_at DESC
      LIMIT 10
    ) as recent_activity
  FROM job_views jv
  LEFT JOIN job_applications ja ON ja.job_id = jv.job_id
  LEFT JOIN job_application_events jae ON jae.job_id = jv.job_id
  WHERE jv.job_id = get_job_analytics_summary.job_id
  AND jv.viewed_at >= start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get overall careers analytics
CREATE OR REPLACE FUNCTION get_careers_analytics(
  days_back INTEGER DEFAULT 30
) RETURNS TABLE (
  total_jobs INTEGER,
  active_jobs INTEGER,
  total_views BIGINT,
  total_applications BIGINT,
  avg_conversion_rate DECIMAL(5,2),
  top_performing_jobs JSONB,
  source_breakdown JSONB,
  daily_stats JSONB
) AS $$
DECLARE
  start_date TIMESTAMP WITH TIME ZONE;
BEGIN
  start_date := NOW() - INTERVAL '1 day' * days_back;
  
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT jp.id) as total_jobs,
    COUNT(DISTINCT CASE WHEN jp.status = 'active' THEN jp.id END) as active_jobs,
    COUNT(DISTINCT jv.id) as total_views,
    COUNT(DISTINCT ja.id) as total_applications,
    CASE 
      WHEN COUNT(DISTINCT jv.session_id) > 0 
      THEN ROUND((COUNT(DISTINCT ja.id)::DECIMAL / COUNT(DISTINCT jv.session_id) * 100), 2)
      ELSE 0 
    END as avg_conversion_rate,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'job_id', jp2.id,
          'title', jp2.title,
          'views', jp2.views_count,
          'applications', jp2.applications_count,
          'conversion_rate', CASE 
            WHEN jp2.views_count > 0 
            THEN ROUND((jp2.applications_count::DECIMAL / jp2.views_count * 100), 2)
            ELSE 0 
          END
        )
      )
      FROM job_postings jp2
      WHERE jp2.created_at >= start_date
      ORDER BY jp2.applications_count DESC
      LIMIT 10
    ) as top_performing_jobs,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'source_type', jst.source_type,
          'count', count(*)
        )
      )
      FROM job_source_tracking jst
      WHERE jst.first_touch_at >= start_date
      GROUP BY jst.source_type
      ORDER BY count(*) DESC
    ) as source_breakdown,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'date', date_series.date,
          'views', COALESCE(daily_views.count, 0),
          'applications', COALESCE(daily_applications.count, 0)
        )
      )
      FROM (
        SELECT generate_series(
          start_date::date, 
          NOW()::date, 
          '1 day'::interval
        )::date as date
      ) date_series
      LEFT JOIN (
        SELECT 
          DATE(jv.viewed_at) as date,
          COUNT(*) as count
        FROM job_views jv
        WHERE jv.viewed_at >= start_date
        GROUP BY DATE(jv.viewed_at)
      ) daily_views ON daily_views.date = date_series.date
      LEFT JOIN (
        SELECT 
          DATE(ja.created_at) as date,
          COUNT(*) as count
        FROM job_applications ja
        WHERE ja.created_at >= start_date
        GROUP BY DATE(ja.created_at)
      ) daily_applications ON daily_applications.date = date_series.date
      ORDER BY date_series.date
    ) as daily_stats
  FROM job_postings jp
  LEFT JOIN job_views jv ON jv.job_id = jp.id AND jv.viewed_at >= start_date
  LEFT JOIN job_applications ja ON ja.job_id = jp.id AND ja.created_at >= start_date
  WHERE jp.created_at >= start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update daily performance metrics
CREATE OR REPLACE FUNCTION update_daily_performance_metrics()
RETURNS VOID AS $$
BEGIN
  -- Insert or update daily metrics for each job
  INSERT INTO job_performance_metrics (
    job_id,
    metric_date,
    metric_type,
    metric_value,
    metric_count
  )
  SELECT 
    jp.id as job_id,
    CURRENT_DATE as metric_date,
    'views' as metric_type,
    jp.views_count as metric_value,
    COUNT(jv.id) as metric_count
  FROM job_postings jp
  LEFT JOIN job_views jv ON jv.job_id = jp.id 
    AND DATE(jv.viewed_at) = CURRENT_DATE
  WHERE jp.status = 'active'
  GROUP BY jp.id, jp.views_count
  
  ON CONFLICT (job_id, metric_date, metric_type) 
  DO UPDATE SET 
    metric_value = EXCLUDED.metric_value,
    metric_count = EXCLUDED.metric_count,
    updated_at = NOW();
  
  -- Update conversion rates
  INSERT INTO job_performance_metrics (
    job_id,
    metric_date,
    metric_type,
    metric_value,
    metric_count
  )
  SELECT 
    jp.id as job_id,
    CURRENT_DATE as metric_date,
    'conversion_rate' as metric_type,
    CASE 
      WHEN jp.views_count > 0 
      THEN ROUND((jp.applications_count::DECIMAL / jp.views_count * 100), 4)
      ELSE 0 
    END as metric_value,
    jp.applications_count as metric_count
  FROM job_postings jp
  WHERE jp.status = 'active'
  
  ON CONFLICT (job_id, metric_date, metric_type) 
  DO UPDATE SET 
    metric_value = EXCLUDED.metric_value,
    metric_count = EXCLUDED.metric_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION track_job_view(UUID, VARCHAR, TEXT, TEXT, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION track_job_view(UUID, VARCHAR, TEXT, TEXT, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION track_application_event(UUID, VARCHAR, UUID, JSONB, VARCHAR, TEXT, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION track_application_event(UUID, VARCHAR, UUID, JSONB, VARCHAR, TEXT, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION track_job_source(UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION track_job_source(UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO service_role;
GRANT EXECUTE ON FUNCTION get_job_analytics_summary(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_careers_analytics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION update_daily_performance_metrics() TO service_role; 