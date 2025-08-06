-- Final fix for get_applications function
DROP FUNCTION IF EXISTS get_applications(integer, integer, uuid, text);

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
        WHERE profiles.id = current_user_id 
        AND profiles.role IN ('admin', 'staff')
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
    INNER JOIN job_postings jp ON ja.job_id = jp.id
    WHERE (job_id_filter IS NULL OR ja.job_id = job_id_filter)
      AND (status_filter IS NULL OR ja.status = status_filter)
    ORDER BY ja.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$; 