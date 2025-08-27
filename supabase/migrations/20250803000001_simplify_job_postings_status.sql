-- Simplify job postings by removing redundant is_public field
-- This migration removes the is_public field and updates RLS policies to use only status

-- First, create a backup of the current state (for safety)
CREATE TABLE IF NOT EXISTS job_postings_backup AS 
SELECT *, NOW() as backup_created_at FROM job_postings;

-- Update existing records to ensure consistency
-- Set is_public = true for all active jobs, false for others
UPDATE job_postings 
SET is_public = (status = 'active')
WHERE is_public IS NULL OR (status = 'active' AND is_public = false) OR (status != 'active' AND is_public = true);

-- Drop all existing RLS policies that depend on is_public column
DROP POLICY IF EXISTS "Public can view active job postings" ON job_postings;
DROP POLICY IF EXISTS "Public can view published job postings" ON job_postings;
DROP POLICY IF EXISTS "Public can read published and active job postings" ON job_postings;
DROP POLICY IF EXISTS "Public can view job postings" ON job_postings;
DROP POLICY IF EXISTS "Public can read job postings" ON job_postings;

-- Create new simplified RLS policy that only checks status
CREATE POLICY "Public can view active job postings" 
ON job_postings FOR SELECT 
USING (status = 'active');

-- Drop any indexes that depend on is_public column
DROP INDEX IF EXISTS idx_job_postings_is_public;

-- Remove the is_public column
ALTER TABLE job_postings DROP COLUMN IF EXISTS is_public;

-- Update the update_job_posting function to remove job_is_public parameter
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

-- Note: A backup of the original job_postings table has been created as job_postings_backup
-- If you need to restore the is_public column, you can:
-- 1. ALTER TABLE job_postings ADD COLUMN is_public BOOLEAN DEFAULT true;
-- 2. UPDATE job_postings SET is_public = (status = 'active');
-- 3. Recreate the original RLS policies
