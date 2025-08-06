-- Create job_postings table
-- This migration creates the base job_postings table

CREATE TABLE IF NOT EXISTS job_postings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requirements TEXT,
  benefits TEXT,
  department VARCHAR(100),
  location VARCHAR(255),
  employment_type VARCHAR(50) DEFAULT 'full-time' CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
  experience_level VARCHAR(50) DEFAULT 'mid' CHECK (experience_level IN ('entry', 'mid', 'senior')),
  salary_range VARCHAR(255),
  application_deadline TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'closed')),
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT true,
  slug VARCHAR(255) UNIQUE,
  views_count INTEGER DEFAULT 0,
  applications_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_by ON job_postings(created_by);
CREATE INDEX IF NOT EXISTS idx_job_postings_department ON job_postings(department);
CREATE INDEX IF NOT EXISTS idx_job_postings_employment_type ON job_postings(employment_type);
CREATE INDEX IF NOT EXISTS idx_job_postings_experience_level ON job_postings(experience_level);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON job_postings(created_at);

-- Enable RLS
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public can view active job postings" 
ON job_postings FOR SELECT 
USING (status = 'active' AND is_public = true);

CREATE POLICY "Authenticated users can view all job postings" 
ON job_postings FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Admin/staff can manage job postings" 
ON job_postings FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff')
  )
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_job_postings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_job_postings_updated_at
  BEFORE UPDATE ON job_postings
  FOR EACH ROW
  EXECUTE FUNCTION update_job_postings_updated_at();

-- Grant permissions
GRANT ALL ON job_postings TO authenticated;
GRANT ALL ON job_postings TO service_role; 