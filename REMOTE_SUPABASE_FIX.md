# Remote Supabase Fix

## Problem
When using the remote Supabase instance, you're getting these errors:

1. **403 Forbidden**: `GET /auth/v1/admin/users` - Admin API call failing
2. **404 Not Found**: `GET /rest/v1/blog_posts` - Missing tables
3. **404 Not Found**: `GET /rest/v1/job_postings` - Missing tables

## Root Cause

### 1. Admin API Call Issue
The `supabase.auth.admin.listUsers()` call requires admin privileges, but the current user might not have admin role.

### 2. Missing Tables
The remote Supabase instance doesn't have the `blog_posts`, `blog_post_files`, and `job_postings` tables that were created in the local instance.

## Solution

### 1. Fixed Admin API Call (Already Done)
✅ **Fixed in code**: Modified `fetchDashboardStats` to only call admin API if user has admin role.

### 2. Create Missing Tables in Remote Supabase

#### Option A: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to your project: `https://szbjuskqrfthmjehknly.supabase.co`
   - Go to **SQL Editor**

2. **Run the Migration Script**
   - Copy the contents of `remote-migrations.sql`
   - Paste it into the SQL Editor
   - Click **Run** to execute

#### Option B: Using Supabase CLI

```bash
# Connect to remote project
supabase link --project-ref szbjuskqrfthmjehknly

# Run the migration
supabase db push
```

### 3. Create Storage Buckets (If Needed)

If you also get storage errors, create these buckets in the Supabase Dashboard:

1. **Go to Storage section**
2. **Create `blog-images` bucket**:
   - Public: ✅
   - File size limit: 5MB
   - Allowed types: `image/jpeg, image/png, image/gif, image/webp`

3. **Create `blog-documents` bucket**:
   - Public: ✅
   - File size limit: 10MB
   - Allowed types: `application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-powerpoint, application/vnd.openxmlformats-officedocument.presentationml.presentation`

## Verification Steps

### 1. Check Tables Exist
```sql
-- Run in SQL Editor
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('blog_posts', 'blog_post_files', 'job_postings');
```

### 2. Test API Calls
```sql
-- Test blog_posts table
SELECT * FROM blog_posts LIMIT 1;

-- Test job_postings table  
SELECT * FROM job_postings LIMIT 1;
```

### 3. Check RLS Policies
```sql
-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('blog_posts', 'blog_post_files', 'job_postings');
```

## What the Migration Creates

### Tables
- **`blog_posts`**: Main blog posts with all fields
- **`blog_post_files`**: Associated files for blog posts
- **`job_postings`**: Job postings for careers section

### Features
- **Auto-generated slugs** for SEO-friendly URLs
- **Row Level Security (RLS)** for data protection
- **Indexes** for better performance
- **Triggers** for automatic timestamps
- **Foreign key relationships** for data integrity

### RLS Policies
- **Public read access** for published content
- **Author-based access** for editing/deleting
- **Authenticated user access** for appropriate operations

## Troubleshooting

### Issue: Migration fails with errors
**Solutions**:
1. Check if tables already exist
2. Run migration in smaller chunks
3. Check for syntax errors

### Issue: Still getting 404 errors
**Solutions**:
1. Verify tables were created successfully
2. Check RLS policies are in place
3. Ensure user has proper permissions

### Issue: Admin API still failing
**Solutions**:
1. Check user role in `auth.users` table
2. Verify user metadata has `role: 'admin'`
3. Test with a different admin user

### Issue: Storage uploads failing
**Solutions**:
1. Create storage buckets manually
2. Configure RLS policies for storage
3. Check bucket permissions

## Files Modified

- `ogetto-otachi-frontend/src/components/StaffDashboard.jsx` - Fixed admin API call
- `ogettootachi-supabase-backend/remote-migrations.sql` - Migration script for remote instance
- `ogettootachi-supabase-backend/REMOTE_SUPABASE_FIX.md` - This documentation

## Next Steps

1. **Run the migration script** in Supabase Dashboard
2. **Test the blog management functionality**
3. **Test file uploads** (if storage buckets are needed)
4. **Verify all dashboard stats load correctly**

## Quick Fix Summary

```bash
# 1. Go to Supabase Dashboard
# 2. Open SQL Editor
# 3. Copy and paste remote-migrations.sql
# 4. Click Run
# 5. Test the application
```

The admin API issue is already fixed in the code, and the missing tables will be resolved by running the migration script. 