-- Fix submit_application function to accept both 'active' and 'published' status
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