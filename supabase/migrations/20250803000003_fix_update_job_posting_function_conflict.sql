-- Fix update_job_posting function conflict
-- This migration ensures only one version of the function exists (without job_is_public)

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
