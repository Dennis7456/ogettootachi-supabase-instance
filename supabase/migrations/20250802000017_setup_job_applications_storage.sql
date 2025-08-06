-- Create job-applications storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'job-applications',
  'job-applications',
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for job-applications bucket
DROP POLICY IF EXISTS "Public can view job application files" ON storage.objects;
CREATE POLICY "Public can view job application files" ON storage.objects
  FOR SELECT USING (bucket_id = 'job-applications');

DROP POLICY IF EXISTS "Authenticated users can upload job application files" ON storage.objects;
CREATE POLICY "Authenticated users can upload job application files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'job-applications');

DROP POLICY IF EXISTS "Users can update their own job application files" ON storage.objects;
CREATE POLICY "Users can update their own job application files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'job-applications');

DROP POLICY IF EXISTS "Users can delete their own job application files" ON storage.objects;
CREATE POLICY "Users can delete their own job application files" ON storage.objects
  FOR DELETE USING (bucket_id = 'job-applications'); 