-- Create professional-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'professional-images',
  'professional-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for professional-images bucket

-- Policy for INSERT (upload) - authenticated users can upload their own professional images
CREATE POLICY "Users can upload their own professional images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'professional-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for UPDATE - authenticated users can update their own professional images
CREATE POLICY "Users can update their own professional images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'professional-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
) WITH CHECK (
  bucket_id = 'professional-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for DELETE - authenticated users can delete their own professional images
CREATE POLICY "Users can delete their own professional images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'professional-images' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for SELECT (read) - public read access for professional images
CREATE POLICY "Public can view professional images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'professional-images'
);

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; 