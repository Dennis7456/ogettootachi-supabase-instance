-- Create database functions for job posting CRUD operations
-- These functions provide secure access to job postings and applications

-- Function to get job postings with filtering
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
    title text,
    slug text,
    description text,
    requirements text,
    benefits text,
    department text,
    location text,
    employment_type text,
    experience_level text,
    salary_range text,
    application_deadline timestamp with time zone,
    status text,
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

-- Function to create a job posting
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
    job_is_public boolean DEFAULT true
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
        is_public,
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
        job_is_public,
        current_user_id,
        'draft'
    ) RETURNING id INTO job_id;
    
    RETURN job_id;
END;
$$;

-- Function to update a job posting
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
    job_is_public boolean DEFAULT NULL,
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
        is_public = COALESCE(job_is_public, is_public),
        status = COALESCE(job_status, status),
        updated_at = NOW()
    WHERE id = job_id;
    
    RETURN FOUND;
END;
$$;

-- Function to delete a job posting
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

-- Function to submit a job application
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
        AND is_public = true
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

-- Function to get applications with filtering
CREATE OR REPLACE FUNCTION get_applications(
    limit_count integer DEFAULT 50,
    offset_count integer DEFAULT 0,
    job_id_filter uuid DEFAULT NULL,
    status_filter text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    job_id uuid,
    job_title text,
    applicant_name text,
    applicant_email text,
    applicant_phone text,
    cover_letter text,
    resume_url text,
    status text,
    admin_notes text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
)
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
        RAISE EXCEPTION 'Unauthorized: Only admins and staff can view applications';
    END IF;
    
    RETURN QUERY
    SELECT 
        ja.id,
        ja.job_id,
        jp.title as job_title,
        ja.applicant_name,
        ja.applicant_email,
        ja.applicant_phone,
        ja.cover_letter,
        ja.resume_url,
        ja.status,
        ja.admin_notes,
        ja.created_at,
        ja.updated_at
    FROM job_applications ja
    JOIN job_postings jp ON ja.job_id = jp.id
    WHERE (job_id_filter IS NULL OR ja.job_id = job_id_filter)
      AND (status_filter IS NULL OR ja.status = status_filter)
    ORDER BY ja.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$;

-- Function to update application status
CREATE OR REPLACE FUNCTION update_application_status(
    application_id uuid,
    new_status text,
    admin_notes text DEFAULT NULL
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
        RAISE EXCEPTION 'Unauthorized: Only admins and staff can update application status';
    END IF;
    
    -- Update the application
    UPDATE job_applications SET
        status = new_status,
        admin_notes = COALESCE(admin_notes, admin_notes),
        updated_at = NOW()
    WHERE id = application_id;
    
    RETURN FOUND;
END;
$$;

-- Function to delete an application
CREATE OR REPLACE FUNCTION delete_application(application_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_id uuid;
    job_id_ref uuid;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    
    -- Check if user is admin or staff
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = current_user_id 
        AND role IN ('admin', 'staff')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins and staff can delete applications';
    END IF;
    
    -- Get job_id before deleting
    SELECT job_id INTO job_id_ref FROM job_applications WHERE id = application_id;
    
    -- Delete the application
    DELETE FROM job_applications WHERE id = application_id;
    
    -- Update applications count if application was deleted
    IF FOUND AND job_id_ref IS NOT NULL THEN
        UPDATE job_postings 
        SET applications_count = GREATEST(0, applications_count - 1)
        WHERE id = job_id_ref;
    END IF;
    
    RETURN FOUND;
END;
$$; 