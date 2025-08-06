# Storage Setup Guide

## Problem
You're getting a "new row violates row-level security policy" error when trying to upload files to Supabase Storage. This happens because the storage buckets have RLS enabled but the policies are not configured correctly.

## Solution

### Option 1: Manual Setup via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to Storage section

2. **Create Storage Buckets**
   - Click "Create a new bucket"
   - Create `blog-images` bucket:
     - Name: `blog-images`
     - Public: ✅ (checked)
     - File size limit: 5MB
     - Allowed MIME types: `image/jpeg, image/png, image/gif, image/webp`
   
   - Create `blog-documents` bucket:
     - Name: `blog-documents`
     - Public: ✅ (checked)
     - File size limit: 10MB
     - Allowed MIME types: `application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation`

3. **Configure RLS Policies**
   - Go to Storage > Policies
   - For each bucket, create these policies:

   **For blog-images bucket:**
   ```sql
   -- Allow public read access
   CREATE POLICY "Public can read blog images" ON storage.objects
   FOR SELECT USING (bucket_id = 'blog-images');
   
   -- Allow authenticated users to upload
   CREATE POLICY "Authenticated users can upload blog images" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'blog-images' 
     AND auth.uid() IS NOT NULL
   );
   
   -- Allow file owners to update
   CREATE POLICY "File owners can update blog images" ON storage.objects
   FOR UPDATE USING (
     bucket_id = 'blog-images' 
     AND auth.uid() = owner
   );
   
   -- Allow file owners to delete
   CREATE POLICY "File owners can delete blog images" ON storage.objects
   FOR DELETE USING (
     bucket_id = 'blog-images' 
     AND auth.uid() = owner
   );
   ```

   **For blog-documents bucket:**
   ```sql
   -- Allow public read access
   CREATE POLICY "Public can read blog documents" ON storage.objects
   FOR SELECT USING (bucket_id = 'blog-documents');
   
   -- Allow authenticated users to upload
   CREATE POLICY "Authenticated users can upload blog documents" ON storage.objects
   FOR INSERT WITH CHECK (
     bucket_id = 'blog-documents' 
     AND auth.uid() IS NOT NULL
   );
   
   -- Allow file owners to update
   CREATE POLICY "File owners can update blog documents" ON storage.objects
   FOR UPDATE USING (
     bucket_id = 'blog-documents' 
     AND auth.uid() = owner
   );
   
   -- Allow file owners to delete
   CREATE POLICY "File owners can delete blog documents" ON storage.objects
   FOR DELETE USING (
     bucket_id = 'blog-documents' 
     AND auth.uid() = owner
   );
   ```

### Option 2: Temporary Disable RLS (Development Only)

If you're in development and want a quick fix:

1. Go to Storage > Settings
2. Disable "Row Level Security" for the storage buckets
3. **Note**: This is not recommended for production

### Option 3: Use Service Role Key (Not Recommended for Frontend)

If you need to bypass RLS entirely (not recommended for security reasons):

```javascript
// Use service role key instead of anon key
const supabase = createClient(
  'your-supabase-url',
  'your-service-role-key' // Instead of anon key
);
```

## Testing the Fix

After setting up the buckets and policies:

1. **Test Image Upload**
   - Try uploading an image in the blog creation form
   - Check browser console for any errors
   - Verify the image appears in the Supabase Storage dashboard

2. **Test Document Upload**
   - Try uploading a PDF or document
   - Check browser console for any errors
   - Verify the document appears in the Supabase Storage dashboard

## Common Issues

### Issue: "new row violates row-level security policy"
**Cause**: RLS is enabled but policies are not configured correctly
**Solution**: Follow Option 1 above to create proper RLS policies

### Issue: "Bucket not found"
**Cause**: Storage buckets don't exist
**Solution**: Create the buckets manually in the Supabase dashboard

### Issue: "File size too large"
**Cause**: File exceeds the bucket's file size limit
**Solution**: Increase the file size limit in bucket settings or compress the file

### Issue: "Invalid file type"
**Cause**: File type not in allowed MIME types
**Solution**: Add the file type to the bucket's allowed MIME types

## Verification

To verify the setup is working:

1. **Check Bucket Creation**
   ```sql
   SELECT * FROM storage.buckets WHERE id IN ('blog-images', 'blog-documents');
   ```

2. **Check RLS Policies**
   ```sql
   SELECT * FROM storage.objects LIMIT 1;
   ```

3. **Test Upload**
   - Try uploading a small test image
   - Check if it appears in the storage dashboard
   - Verify the public URL works

## Production Considerations

1. **Security**: Always use RLS policies in production
2. **File Size**: Set appropriate file size limits
3. **File Types**: Restrict to only necessary file types
4. **CDN**: Consider using a CDN for better performance
5. **Backup**: Implement regular backups of important files

## Troubleshooting

If you're still having issues:

1. **Check Authentication**: Ensure the user is properly authenticated
2. **Check Permissions**: Verify the user has the necessary permissions
3. **Check Bucket Settings**: Ensure buckets are public and accessible
4. **Check File Size**: Ensure files are within size limits
5. **Check File Type**: Ensure files are of allowed types
6. **Check Network**: Ensure there are no network connectivity issues

## Support

If you continue to have issues:
1. Check the Supabase documentation for storage setup
2. Review the RLS policies in your Supabase dashboard
3. Test with a simple file upload first
4. Check browser console for detailed error messages 