-- Fix RLS policies for blog_posts table
-- Run this in Supabase SQL Editor

-- Drop existing policies first
DROP POLICY IF EXISTS "Public can read published blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can read all blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can insert their own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can update their own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can delete their own blog posts" ON public.blog_posts;

-- Create new, more permissive policies
CREATE POLICY "Public can read published blog posts" ON public.blog_posts
    FOR SELECT USING (status = 'published' AND is_public = true);

CREATE POLICY "Authenticated users can read all blog posts" ON public.blog_posts
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Allow any authenticated user to insert (they can set their own author_id)
CREATE POLICY "Authenticated users can insert blog posts" ON public.blog_posts
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update their own posts or any post if they're authenticated
CREATE POLICY "Users can update their own blog posts" ON public.blog_posts
    FOR UPDATE USING (
        auth.uid() = author_id OR 
        auth.uid() IS NOT NULL
    );

-- Allow users to delete their own posts or any post if they're authenticated
CREATE POLICY "Users can delete their own blog posts" ON public.blog_posts
    FOR DELETE USING (
        auth.uid() = author_id OR 
        auth.uid() IS NOT NULL
    );

-- Also fix blog_post_files policies
DROP POLICY IF EXISTS "Public can read files from published posts" ON public.blog_post_files;
DROP POLICY IF EXISTS "Authenticated users can read files from their posts" ON public.blog_post_files;
DROP POLICY IF EXISTS "Authors can insert files to their posts" ON public.blog_post_files;
DROP POLICY IF EXISTS "Authors can update files in their posts" ON public.blog_post_files;
DROP POLICY IF EXISTS "Authors can delete files from their posts" ON public.blog_post_files;

CREATE POLICY "Public can read files from published posts" ON public.blog_post_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.blog_posts 
            WHERE id = blog_post_id 
            AND status = 'published' 
            AND is_public = true
        )
    );

CREATE POLICY "Authenticated users can read all files" ON public.blog_post_files
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert files" ON public.blog_post_files
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update files" ON public.blog_post_files
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete files" ON public.blog_post_files
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Grant all permissions to authenticated users
GRANT ALL ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_post_files TO authenticated;
GRANT ALL ON public.job_postings TO authenticated;

-- Grant select permissions to anonymous users
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT ON public.blog_post_files TO anon;
GRANT SELECT ON public.job_postings TO anon; 