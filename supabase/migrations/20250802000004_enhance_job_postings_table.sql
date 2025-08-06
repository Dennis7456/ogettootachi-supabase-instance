-- Enhance job_postings table with additional fields
-- This migration adds missing fields to support full job posting functionality

-- Add missing columns to job_postings table
ALTER TABLE job_postings 
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50) CHECK (experience_level IN ('entry', 'mid', 'senior')),
ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50) CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
ADD COLUMN IF NOT EXISTS benefits TEXT,
ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS applications_count INTEGER DEFAULT 0;

-- Update status constraint to include 'draft' status
ALTER TABLE job_postings 
DROP CONSTRAINT IF EXISTS job_postings_status_check;

ALTER TABLE job_postings 
ADD CONSTRAINT job_postings_status_check 
CHECK (status IN ('draft', 'active', 'inactive', 'closed'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_postings_department ON job_postings(department);
CREATE INDEX IF NOT EXISTS idx_job_postings_experience_level ON job_postings(experience_level);
CREATE INDEX IF NOT EXISTS idx_job_postings_employment_type ON job_postings(employment_type);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_by ON job_postings(created_by);
CREATE INDEX IF NOT EXISTS idx_job_postings_is_public ON job_postings(is_public);
CREATE INDEX IF NOT EXISTS idx_job_postings_slug ON job_postings(slug);
CREATE INDEX IF NOT EXISTS idx_job_postings_application_deadline ON job_postings(application_deadline);

-- Create function to generate slug from title
CREATE OR REPLACE FUNCTION generate_job_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'))
           || '-' || extract(epoch from now())::text;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate slug for job postings
CREATE OR REPLACE FUNCTION trigger_set_job_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_job_slug(NEW.title);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for job postings slug generation
DROP TRIGGER IF EXISTS trigger_set_job_postings_slug ON job_postings;
CREATE TRIGGER trigger_set_job_postings_slug
    BEFORE INSERT ON job_postings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_job_slug();

-- Update RLS policies for enhanced job_postings table
DROP POLICY IF EXISTS "Public can read active job postings" ON job_postings;
DROP POLICY IF EXISTS "Authenticated users can read all job postings" ON job_postings;
DROP POLICY IF EXISTS "Authenticated users can insert job postings" ON job_postings;
DROP POLICY IF EXISTS "Authenticated users can update job postings" ON job_postings;
DROP POLICY IF EXISTS "Authenticated users can delete job postings" ON job_postings;

-- Create new RLS policies
CREATE POLICY "Public can read active and public job postings" ON job_postings
    FOR SELECT USING (status = 'active' AND is_public = true);

CREATE POLICY "Authenticated users can read all job postings" ON job_postings
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins and staff can create job postings" ON job_postings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Admins and staff can update job postings" ON job_postings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Admins and staff can delete job postings" ON job_postings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'staff')
        )
    );

-- Grant permissions
GRANT ALL ON job_postings TO authenticated;
GRANT SELECT ON job_postings TO anon; 