-- Create email_logs table for tracking job application emails
-- This table will track all emails sent for job applications

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  template VARCHAR(100),
  status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,
  application_id UUID REFERENCES job_applications(id),
  job_id UUID REFERENCES job_postings(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_application_id ON email_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_job_id ON email_logs(job_id);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin/staff can view email logs" 
ON email_logs FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff')
  )
);

CREATE POLICY "Service role can manage email logs" 
ON email_logs FOR ALL 
USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON email_logs TO authenticated;
GRANT ALL ON email_logs TO service_role; 