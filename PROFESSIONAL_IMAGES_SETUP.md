# Professional Images Setup Guide

This guide will help you set up the professional images functionality for the law firm website.

## ✅ Completed Steps

1. **Frontend Code Updates**: ✅
   - Updated TeamPage.jsx to display professional images
   - Updated TeamMemberModal.jsx to show professional images
   - Updated StaffDashboard.jsx to upload professional images
   - Updated storage.js with uploadProfessionalImage function
   - Updated handle-invitation Edge Function to handle professional_image field

2. **Backend Configuration**: ✅
   - Updated .env file with correct remote Supabase URL
   - Created scripts to test and verify setup

## 📋 Manual Setup Required

### Step 1: Add Professional Image Column to Database

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/szbjuskqrfthmjehknly
2. Navigate to **Database > Tables > profiles**
3. Click **"Add column"**
4. Set the following values:
   - **Name**: `professional_image`
   - **Type**: `text`
   - **Default Value**: `null`
   - **Is Nullable**: ✅ (checked)
5. Click **"Save"**

### Step 2: Create Professional Images Bucket

1. Go to **Storage** in your Supabase Dashboard
2. Click **"Create a new bucket"**
3. Set the following values:
   - **Name**: `professional-images`
   - **Public bucket**: ✅ (checked)
   - **File size limit**: `5MB`
   - **Allowed MIME types**: `image/png, image/jpeg, image/jpg, image/gif`
4. Click **"Create bucket"**

### Step 3: Set Up RLS Policies for the Bucket

1. Go to **Storage > Policies**
2. Click on the **"professional-images"** bucket
3. Add these policies:

#### Policy 1: Public Read Access
- **Name**: "Public can view professional images"
- **Policy definition**: 
```sql
(bucket_id = 'professional-images')
```

#### Policy 2: Authenticated Upload
- **Name**: "Users can upload their own professional images"
- **Policy definition**:
```sql
(bucket_id = 'professional-images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)
```

#### Policy 3: Authenticated Update
- **Name**: "Users can update their own professional images"
- **Policy definition**:
```sql
(bucket_id = 'professional-images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)
```

#### Policy 4: Authenticated Delete
- **Name**: "Users can delete their own professional images"
- **Policy definition**:
```sql
(bucket_id = 'professional-images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)
```

## 🔧 Verification Scripts

After completing the manual setup, run these scripts to verify everything is working:

```bash
# Test the database column
node add-professional-image-column-remote.js

# Test the bucket setup
node setup-professional-images-bucket-remote.js

# Test the complete functionality
node test-remote-profiles.js
```

## 🎯 Features Implemented

### Frontend Features:
- **Team Page Cards**: Display professional images in team member cards
- **Modal Details**: Show professional images in detailed modal views
- **Staff Dashboard**: Upload and manage professional images
- **Responsive Design**: Professional images work on all screen sizes
- **Hover Effects**: Smooth animations and interactions

### Backend Features:
- **Separate Storage**: Professional images stored in dedicated bucket
- **Security**: RLS policies ensure proper access control
- **File Validation**: Type and size restrictions
- **User Isolation**: Users can only access their own images
- **Public Read**: Anyone can view professional images

### Technical Features:
- **Cache Busting**: Prevents caching issues with image updates
- **Error Handling**: Comprehensive error handling and user feedback
- **Loading States**: Visual feedback during uploads
- **File Management**: Upload, update, and delete functionality

## 🚀 Usage

Once setup is complete:

1. **Staff Users**: Can upload professional images via the Staff Dashboard
2. **Team Page**: Will display professional images in team member cards
3. **Modal Views**: Will show professional images in detailed team member modals
4. **File Structure**: Images stored as `professional-images/user-id/professional.ext`

## 🔒 Security

- **Authentication Required**: Only authenticated users can upload/update/delete
- **User Isolation**: Users can only access their own images
- **Public Read**: Professional images are publicly viewable
- **File Validation**: Only image files up to 5MB are allowed
- **RLS Policies**: Row-level security ensures proper access control

## 📝 Notes

- Professional images are stored separately from profile pictures
- The system uses the same user ID for file organization
- Images are automatically resized and optimized
- Cache busting ensures fresh images are always displayed
- Error handling provides clear feedback to users 