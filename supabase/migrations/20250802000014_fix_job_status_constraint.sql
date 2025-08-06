-- Update job_postings status constraint to include 'published'
ALTER TABLE job_postings DROP CONSTRAINT IF EXISTS job_postings_status_check;
ALTER TABLE job_postings ADD CONSTRAINT job_postings_status_check 
  CHECK (status::text = ANY (ARRAY['draft'::character varying, 'active'::character varying, 'published'::character varying, 'inactive'::character varying, 'closed'::character varying, 'archived'::character varying]::text[]));

-- Update existing 'active' jobs to 'published' for consistency
UPDATE job_postings SET status = 'published' WHERE status = 'active'; 