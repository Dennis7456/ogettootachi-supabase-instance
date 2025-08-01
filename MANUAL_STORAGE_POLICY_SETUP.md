# Manual Storage Policy Setup for Professional Images

Since the automated script failed due to missing `exec_sql` function, you need to set up the policies manually in your Supabase dashboard.

## Step 1: Access Your Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/szbjuskqrfthmjehknly
2. Navigate to **Storage** in the left sidebar
3. Click on the **"professional-images"** bucket

## Step 2: Set Up RLS Policies

### Policy 1: Public Read Access
- **Name**: `Public can view professional images`
- **Operation**: SELECT
- **Policy Definition**: 
  ```sql
  (bucket_id = 'professional-images')
  ```

### Policy 2: Authenticated User Upload
- **Name**: `Users can upload their own professional images`
- **Operation**: INSERT
- **Policy Definition**:
  ```sql
  (bucket_id = 'professional-images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)
  ```

### Policy 3: Authenticated User Update
- **Name**: `Users can update their own professional images`
- **Operation**: UPDATE
- **Policy Definition**:
  ```sql
  (bucket_id = 'professional-images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)
  ```

### Policy 4: Authenticated User Delete
- **Name**: `Users can delete their own professional images`
- **Operation**: DELETE
- **Policy Definition**:
  ```sql
  (bucket_id = 'professional-images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)
  ```

## Step 3: Enable RLS

Make sure Row Level Security is enabled on the `storage.objects` table.

## Step 4: Test the Upload

After setting up these policies, try uploading a professional image again in your application.

## Troubleshooting

If you still get RLS errors after setting up these policies:

1. **Check the bucket name**: Make sure the bucket is named exactly `professional-images`
2. **Check the file path**: The file should be uploaded to `professional-images/<user-id>/professional.jpg`
3. **Check user authentication**: Make sure the user is logged in
4. **Check user ID**: The folder name must match the authenticated user's UID

## Alternative: Temporary Disable RLS (For Testing)

If you want to test without RLS temporarily:

1. Go to Storage > Policies
2. Click on the professional-images bucket
3. Toggle off "Enable Row Level Security" temporarily
4. Test your upload
5. Re-enable RLS and set up the policies properly

**Note**: Only disable RLS temporarily for testing. Always re-enable it for production. 