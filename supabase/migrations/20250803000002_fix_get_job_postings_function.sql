-- Fix get_job_postings function to remove is_public column reference
-- This migration updates the function after the is_public column was removed

-- Drop the existing function
DROP FUNCTION IF EXISTS get_job_postings(integer, integer, text, text, text, text);

-- Recreate the function without is_public column
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

-- Fix submit_application function to remove is_public reference
CREATE OR REPLACE FUNCTION submit_application(
    job_id uuid,
    applicant_name text,
    applicant_email text,
    applicant_phone text DEFAULT NULL,
    cover_letter text DEFAULT NULL,
    resume_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    application_id uuid;
BEGIN
    -- Check if job posting exists and is active or published
    IF NOT EXISTS (
        SELECT 1 FROM job_postings 
        WHERE id = job_id 
        AND status IN ('active', 'published')
    ) THEN
        RAISE EXCEPTION 'Job posting not found or not active';
    END IF;
    
    -- Check if application deadline has passed
    IF EXISTS (
        SELECT 1 FROM job_postings 
        WHERE id = job_id 
        AND application_deadline IS NOT NULL 
        AND application_deadline < NOW()
    ) THEN
        RAISE EXCEPTION 'Application deadline has passed';
    END IF;
    
    -- Insert the application
    INSERT INTO job_applications (
        job_id,
        applicant_name,
        applicant_email,
        applicant_phone,
        cover_letter,
        resume_url
    ) VALUES (
        job_id,
        applicant_name,
        applicant_email,
        applicant_phone,
        cover_letter,
        resume_url
    ) RETURNING id INTO application_id;
    
    -- Update applications count
    UPDATE job_postings 
    SET applications_count = applications_count + 1
    WHERE id = job_id;
    
    RETURN application_id;
END;
$$;


-- Drop the existing function
DROP FUNCTION IF EXISTS get_job_postings(integer, integer, text, text, text, text);

-- Recreate the function without is_public column
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

-- Fix submit_application function to remove is_public reference
CREATE OR REPLACE FUNCTION submit_application(
    job_id uuid,
    applicant_name text,
    applicant_email text,
    applicant_phone text DEFAULT NULL,
    cover_letter text DEFAULT NULL,
    resume_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    application_id uuid;
BEGIN
    -- Check if job posting exists and is active or published
    IF NOT EXISTS (
        SELECT 1 FROM job_postings 
        WHERE id = job_id 
        AND status IN ('active', 'published')
    ) THEN
        RAISE EXCEPTION 'Job posting not found or not active';
    END IF;
    
    -- Check if application deadline has passed
    IF EXISTS (
        SELECT 1 FROM job_postings 
        WHERE id = job_id 
        AND application_deadline IS NOT NULL 
        AND application_deadline < NOW()
    ) THEN
        RAISE EXCEPTION 'Application deadline has passed';
    END IF;
    
    -- Insert the application
    INSERT INTO job_applications (
        job_id,
        applicant_name,
        applicant_email,
        applicant_phone,
        cover_letter,
        resume_url
    ) VALUES (
        job_id,
        applicant_name,
        applicant_email,
        applicant_phone,
        cover_letter,
        resume_url
    ) RETURNING id INTO application_id;
    
    -- Update applications count
    UPDATE job_postings 
    SET applications_count = applications_count + 1
    WHERE id = job_id;
    
    RETURN application_id;
END;
$$;
