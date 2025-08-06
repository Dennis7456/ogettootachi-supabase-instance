-- Drop existing policies that filter by 'active' status
DROP POLICY IF EXISTS "Public can view active job postings" ON job_postings;
DROP POLICY IF EXISTS "Public can read active and public job postings" ON job_postings;

-- Create new policies that include 'published' status
CREATE POLICY "Public can view published job postings" ON job_postings
  FOR SELECT USING (
    (status = 'published' OR status = 'active') AND is_public = true
  );

CREATE POLICY "Public can read published and active job postings" ON job_postings
  FOR SELECT USING (
    (status = 'published' OR status = 'active') AND is_public = true
  ); 