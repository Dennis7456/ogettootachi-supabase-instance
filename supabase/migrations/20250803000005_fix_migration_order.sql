-- Fix migration order - handle case where is_public column already removed
-- This migration safely handles the situation where the column was already dropped

-- Check if is_public column exists before trying to use it
DO $$
BEGIN
    -- Only try to update if the column still exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'job_postings' 
        AND column_name = 'is_public'
    ) THEN
        -- Update existing records to ensure consistency
        UPDATE job_postings 
        SET is_public = (status = 'active')
        WHERE is_public IS NULL OR (status = 'active' AND is_public = false) OR (status != 'active' AND is_public = true);
    END IF;
END $$;

-- Drop all existing RLS policies that depend on is_public column (safe to do even if they don't exist)
DROP POLICY IF EXISTS "Public can view active job postings" ON job_postings;
DROP POLICY IF EXISTS "Public can view published job postings" ON job_postings;
DROP POLICY IF EXISTS "Public can read published and active job postings" ON job_postings;
DROP POLICY IF EXISTS "Public can view job postings" ON job_postings;
DROP POLICY IF EXISTS "Public can read job postings" ON job_postings;

-- Create new simplified RLS policy that only checks status
CREATE POLICY "Public can view active job postings" 
ON job_postings FOR SELECT 
USING (status = 'active');

-- Drop any indexes that depend on is_public column (safe to do even if they don't exist)
DROP INDEX IF EXISTS idx_job_postings_is_public;

-- Remove the is_public column if it still exists
ALTER TABLE job_postings DROP COLUMN IF EXISTS is_public;

-- Drop all existing versions of the function to avoid conflicts
DROP FUNCTION IF EXISTS update_job_posting(uuid, text, text, text, text, text, text, text, text, text, timestamp with time zone, boolean, text);
DROP FUNCTION IF EXISTS update_job_posting(uuid, text, text, text, text, text, text, text, text, text, timestamp with time zone, text);

-- Create the correct version without job_is_public parameter
CREATE OR REPLACE FUNCTION update_job_posting(
    job_id uuid,
    job_title text DEFAULT NULL,
    job_description text DEFAULT NULL,
    job_requirements text DEFAULT NULL,
    job_benefits text DEFAULT NULL,
    job_department text DEFAULT NULL,
    job_location text DEFAULT NULL,
    job_employment_type text DEFAULT NULL,
    job_experience_level text DEFAULT NULL,
    job_salary_range text DEFAULT NULL,
    job_application_deadline timestamp with time zone DEFAULT NULL,
    job_status text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Check if user is admin or staff
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = current_user_id 
        AND role IN ('admin', 'staff')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins and staff can update job postings';
    END IF;
    
    -- Update the job posting
    UPDATE job_postings SET
        title = COALESCE(job_title, title),
        description = COALESCE(job_description, description),
        requirements = COALESCE(job_requirements, requirements),
        benefits = COALESCE(job_benefits, benefits),
        department = COALESCE(job_department, department),
        location = COALESCE(job_location, location),
        employment_type = COALESCE(job_employment_type, employment_type),
        experience_level = COALESCE(job_experience_level, experience_level),
        salary_range = COALESCE(job_salary_range, salary_range),
        application_deadline = COALESCE(job_application_deadline, application_deadline),
        status = COALESCE(job_status, status),
        updated_at = NOW()
    WHERE id = job_id;
    
    RETURN FOUND;
END;
$$;

-- Update the create_job_posting function to remove job_is_public parameter
CREATE OR REPLACE FUNCTION create_job_posting(
    job_title text,
    job_description text,
    job_requirements text DEFAULT NULL,
    job_benefits text DEFAULT NULL,
    job_department text DEFAULT NULL,
    job_location text DEFAULT NULL,
    job_employment_type text DEFAULT 'full-time',
    job_experience_level text DEFAULT 'mid',
    job_salary_range text DEFAULT NULL,
    job_application_deadline timestamp with time zone DEFAULT NULL,
    job_status text DEFAULT 'draft'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    job_id uuid;
    current_user_id uuid;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Check if user is admin or staff
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = current_user_id 
        AND role IN ('admin', 'staff')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins and staff can create job postings';
    END IF;
    
    -- Insert the job posting
    INSERT INTO job_postings (
        title,
        description,
        requirements,
        benefits,
        department,
        location,
        employment_type,
        experience_level,
        salary_range,
        application_deadline,
        created_by,
        status
    ) VALUES (
        job_title,
        job_description,
        job_requirements,
        job_benefits,
        job_department,
        job_location,
        job_employment_type,
        job_experience_level,
        job_salary_range,
        job_application_deadline,
        current_user_id,
        job_status
    ) RETURNING id INTO job_id;
    
    RETURN job_id;
END;
$$;

-- Drop the existing get_job_postings function
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
    -- Check if job posting exists and is active
    IF NOT EXISTS (
        SELECT 1 FROM job_postings 
        WHERE id = job_id 
        AND status = 'active'
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

-- Ensure delete_job_posting function is correct
CREATE OR REPLACE FUNCTION delete_job_posting(job_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Check if user is admin or staff
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = current_user_id 
        AND role IN ('admin', 'staff')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins and staff can delete job postings';
    END IF;
    
    -- Delete the job posting
    DELETE FROM job_postings WHERE id = job_id;
    
    RETURN FOUND;
END;
$$;
