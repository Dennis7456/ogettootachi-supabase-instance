-- Fix data type mismatch in get_job_postings function for remote database
-- This migration ensures the function matches the actual column types

-- Drop the existing function
DROP FUNCTION IF EXISTS get_job_postings(integer, integer, text, text, text, text);

-- Recreate the function with correct data types
CREATE OR REPLACE FUNCTION get_job_postings(
    limit_count integer DEFAULT 50,
    offset_count integer DEFAULT 0,
    status_filter text DEFAULT NULL,
    department_filter text DEFAULT NULL,
    experience_filter text DEFAULT NULL,
    employment_type_filter text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    title character varying(255),
    slug character varying(255),
    description text,
    requirements text,
    benefits text,
    department character varying(100),
    location character varying(255),
    employment_type character varying(50),
    experience_level character varying(50),
    salary_range character varying(255),
    application_deadline timestamp with time zone,
    status character varying(50),
    is_public boolean,
    views_count integer,
    applications_count integer,
    created_by uuid,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jp.id,
        jp.title,
        jp.slug,
        jp.description,
        jp.requirements,
        jp.benefits,
        jp.department,
        jp.location,
        jp.employment_type,
        jp.experience_level,
        jp.salary_range,
        jp.application_deadline,
        jp.status,
        jp.is_public,
        jp.views_count,
        jp.applications_count,
        jp.created_by,
        jp.created_at,
        jp.updated_at
    FROM job_postings jp
    WHERE (status_filter IS NULL OR jp.status = status_filter)
      AND (department_filter IS NULL OR jp.department = department_filter)
      AND (experience_filter IS NULL OR jp.experience_level = experience_filter)
      AND (employment_type_filter IS NULL OR jp.employment_type = employment_type_filter)
    ORDER BY jp.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$; 