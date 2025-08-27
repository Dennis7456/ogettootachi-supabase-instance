-- Drop the existing function first
DROP FUNCTION IF EXISTS get_careers_analytics(INTEGER);

-- Create the get_careers_analytics function with correct return types
CREATE OR REPLACE FUNCTION get_careers_analytics(
  days_back INTEGER DEFAULT 30
) RETURNS TABLE (
  total_jobs BIGINT,
  active_jobs BIGINT,
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
      FROM (
        SELECT id, title, views_count, applications_count
        FROM job_postings 
        WHERE created_at >= start_date
        ORDER BY applications_count DESC
        LIMIT 10
      ) jp2
    ) as top_performing_jobs,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'source_type', jst.source_type,
          'count', jst.count
        )
      )
      FROM (
        SELECT 
          source_type,
          COUNT(*) as count
        FROM job_source_tracking 
        WHERE first_touch_at >= start_date
        GROUP BY source_type
        ORDER BY count DESC
      ) jst
    ) as source_breakdown,
    '[]'::jsonb as daily_stats  -- Simplified: return empty array for now
  FROM job_postings jp
  LEFT JOIN job_views jv ON jv.job_id = jp.id AND jv.viewed_at >= start_date
  LEFT JOIN job_applications ja ON ja.job_id = jp.id AND ja.created_at >= start_date
  WHERE jp.created_at >= start_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_careers_analytics(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_careers_analytics(INTEGER) TO service_role;
