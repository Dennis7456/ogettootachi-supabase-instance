-- Create functions for sending job application emails
-- These functions will handle email notifications for job applications

-- Function to send application received confirmation to applicant
CREATE OR REPLACE FUNCTION send_application_confirmation_email(
  application_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  application_record RECORD;
  job_record RECORD;
  email_sent BOOLEAN := FALSE;
BEGIN
  -- Get application details
  SELECT 
    ja.id,
    ja.applicant_name,
    ja.applicant_email,
    ja.applicant_phone,
    ja.created_at,
    ja.job_id,
    jp.title as job_title,
    jp.department,
    jp.location,
    jp.employment_type,
    jp.experience_level
  INTO application_record
  FROM job_applications ja
  JOIN job_postings jp ON ja.job_id = jp.id
  WHERE ja.id = application_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
  
  -- Send confirmation email to applicant
  -- This would typically call an external email service
  -- For now, we'll just log the email
  INSERT INTO email_logs (
    to_email,
    subject,
    template,
    application_id,
    job_id,
    status
  ) VALUES (
    application_record.applicant_email,
    'Application Received - ' || application_record.job_title,
    'application-received',
    application_id,
    application_record.job_id,
    'sent'
  );
  
  email_sent := TRUE;
  
  RETURN email_sent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send admin notification for new application
CREATE OR REPLACE FUNCTION send_admin_application_notification(
  application_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  application_record RECORD;
  job_record RECORD;
  admin_emails TEXT[];
  email_sent BOOLEAN := FALSE;
  admin_email TEXT;
BEGIN
  -- Get application details
  SELECT 
    ja.id,
    ja.applicant_name,
    ja.applicant_email,
    ja.applicant_phone,
    ja.created_at,
    ja.job_id,
    jp.title as job_title,
    jp.department,
    jp.location,
    jp.employment_type,
    jp.experience_level
  INTO application_record
  FROM job_applications ja
  JOIN job_postings jp ON ja.job_id = jp.id
  WHERE ja.id = application_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
  
  -- Get admin emails
  SELECT ARRAY_AGG(email) INTO admin_emails
  FROM profiles 
  WHERE role IN ('admin', 'staff') 
  AND email IS NOT NULL;
  
  -- Send notification to each admin
  FOREACH admin_email IN ARRAY admin_emails
  LOOP
    INSERT INTO email_logs (
      to_email,
      subject,
      template,
      application_id,
      job_id,
      status
    ) VALUES (
      admin_email,
      'New Job Application - ' || application_record.job_title,
      'admin-application-notification',
      application_id,
      application_record.job_id,
      'sent'
    );
    
    email_sent := TRUE;
  END LOOP;
  
  RETURN email_sent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send application status update email
CREATE OR REPLACE FUNCTION send_application_status_update(
  application_id UUID,
  new_status VARCHAR(50),
  admin_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  application_record RECORD;
  job_record RECORD;
  email_sent BOOLEAN := FALSE;
  status_subject TEXT;
  status_template TEXT;
BEGIN
  -- Get application details
  SELECT 
    ja.id,
    ja.applicant_name,
    ja.applicant_email,
    ja.applicant_phone,
    ja.status,
    ja.job_id,
    jp.title as job_title,
    jp.department,
    jp.location
  INTO application_record
  FROM job_applications ja
  JOIN job_postings jp ON ja.job_id = jp.id
  WHERE ja.id = application_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;
  
  -- Determine email template based on status
  CASE new_status
    WHEN 'shortlisted' THEN
      status_subject := 'Application Shortlisted - ' || application_record.job_title;
      status_template := 'application-shortlisted';
    WHEN 'rejected' THEN
      status_subject := 'Application Update - ' || application_record.job_title;
      status_template := 'application-rejected';
    WHEN 'interview_scheduled' THEN
      status_subject := 'Interview Scheduled - ' || application_record.job_title;
      status_template := 'interview-scheduled';
    ELSE
      status_subject := 'Application Status Update - ' || application_record.job_title;
      status_template := 'application-status-update';
  END CASE;
  
  -- Send status update email
  INSERT INTO email_logs (
    to_email,
    subject,
    template,
    application_id,
    job_id,
    status
  ) VALUES (
    application_record.applicant_email,
    status_subject,
    status_template,
    application_id,
    application_record.job_id,
    'sent'
  );
  
  email_sent := TRUE;
  
  RETURN email_sent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get email statistics
CREATE OR REPLACE FUNCTION get_email_statistics(
  days_back INTEGER DEFAULT 30
) RETURNS TABLE (
  total_emails BIGINT,
  successful_emails BIGINT,
  failed_emails BIGINT,
  applications_confirmed BIGINT,
  admin_notifications_sent BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_emails,
    COUNT(*) FILTER (WHERE status = 'sent') as successful_emails,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_emails,
    COUNT(*) FILTER (WHERE template = 'application-received') as applications_confirmed,
    COUNT(*) FILTER (WHERE template = 'admin-application-notification') as admin_notifications_sent
  FROM email_logs
  WHERE sent_at >= NOW() - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION send_application_confirmation_email(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_admin_application_notification(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_application_status_update(UUID, VARCHAR, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_email_statistics(INTEGER) TO authenticated; 