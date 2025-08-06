-- Remote Supabase Migrations
-- Run these in the Supabase SQL Editor to create missing tables

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    meta_title VARCHAR(60),
    meta_description VARCHAR(160),
    featured_image_url TEXT,
    read_time INTEGER DEFAULT 5,
    resource_type VARCHAR(50),
    is_public BOOLEAN DEFAULT true,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    slug VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog_post_files table
CREATE TABLE IF NOT EXISTS public.blog_post_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blog_post_id UUID REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create job_postings table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.job_postings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT,
    location VARCHAR(255),
    type VARCHAR(50), -- full-time, part-time, contract, etc.
    salary_range VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON public.blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON public.blog_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);

CREATE INDEX IF NOT EXISTS idx_blog_post_files_blog_post_id ON public.blog_post_files(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_files_file_type ON public.blog_post_files(file_type);
CREATE INDEX IF NOT EXISTS idx_blog_post_files_created_at ON public.blog_post_files(created_at);

CREATE INDEX IF NOT EXISTS idx_job_postings_status ON public.job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_type ON public.job_postings(type);
CREATE INDEX IF NOT EXISTS idx_job_postings_created_at ON public.job_postings(created_at);

-- Enable Row Level Security
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for blog_posts
CREATE POLICY "Public can read published blog posts" ON public.blog_posts
    FOR SELECT USING (status = 'published' AND is_public = true);

CREATE POLICY "Authenticated users can read all blog posts" ON public.blog_posts
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authors can insert their own blog posts" ON public.blog_posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own blog posts" ON public.blog_posts
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Authors can delete their own blog posts" ON public.blog_posts
    FOR DELETE USING (auth.uid() = author_id);

-- Create RLS policies for blog_post_files
CREATE POLICY "Public can read files from published posts" ON public.blog_post_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.blog_posts 
            WHERE id = blog_post_id 
            AND status = 'published' 
            AND is_public = true
        )
    );

CREATE POLICY "Authenticated users can read files from their posts" ON public.blog_post_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.blog_posts 
            WHERE id = blog_post_id 
            AND author_id = auth.uid()
        )
    );

CREATE POLICY "Authors can insert files to their posts" ON public.blog_post_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.blog_posts 
            WHERE id = blog_post_id 
            AND author_id = auth.uid()
        )
    );

CREATE POLICY "Authors can update files in their posts" ON public.blog_post_files
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.blog_posts 
            WHERE id = blog_post_id 
            AND author_id = auth.uid()
        )
    );

CREATE POLICY "Authors can delete files from their posts" ON public.blog_post_files
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.blog_posts 
            WHERE id = blog_post_id 
            AND author_id = auth.uid()
        )
    );

-- Create RLS policies for job_postings
CREATE POLICY "Public can read active job postings" ON public.job_postings
    FOR SELECT USING (status = 'active');

CREATE POLICY "Authenticated users can read all job postings" ON public.job_postings
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert job postings" ON public.job_postings
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update job postings" ON public.job_postings
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete job postings" ON public.job_postings
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create function to auto-generate slugs
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'))
           || '-' || extract(epoch from now())::text;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate slugs
CREATE OR REPLACE FUNCTION trigger_set_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_slug(NEW.title);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_blog_posts_slug
    BEFORE INSERT ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_slug();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_update_blog_posts_updated_at
    BEFORE UPDATE ON public.blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_blog_post_files_updated_at
    BEFORE UPDATE ON public.blog_post_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_job_postings_updated_at
    BEFORE UPDATE ON public.job_postings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_post_files TO authenticated;
GRANT ALL ON public.job_postings TO authenticated;

GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT ON public.blog_post_files TO anon;
GRANT SELECT ON public.job_postings TO anon; 

-- Fix practice_areas table to rename 'name' column to 'title'
-- This migration addresses the issue where the frontend expects a 'title' column
-- but the database has a 'name' column

-- First, check if the 'name' column exists and rename it to 'title'
DO $$ 
BEGIN
    -- Check if 'name' column exists and 'title' column doesn't exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'practice_areas' 
        AND column_name = 'name'
        AND table_schema = 'public'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'practice_areas' 
        AND column_name = 'title'
        AND table_schema = 'public'
    ) THEN
        -- Rename the column from 'name' to 'title'
        ALTER TABLE public.practice_areas RENAME COLUMN name TO title;
        
        -- Update the column type to match the expected schema
        ALTER TABLE public.practice_areas ALTER COLUMN title TYPE VARCHAR(255);
        
        RAISE NOTICE 'Successfully renamed practice_areas.name to practice_areas.title';
    ELSE
        RAISE NOTICE 'Column rename not needed - either name column does not exist or title column already exists';
    END IF;
END $$;

-- Ensure the title column has the correct constraints
ALTER TABLE public.practice_areas ALTER COLUMN title SET NOT NULL;

-- Add any missing columns that should be in the practice_areas table
DO $$ 
BEGIN
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'practice_areas' 
        AND column_name = 'created_by'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.practice_areas ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added created_by column to practice_areas table';
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'practice_areas' 
        AND column_name = 'is_active'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.practice_areas ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column to practice_areas table';
    END IF;
END $$;

-- Create index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_practice_areas_is_active ON public.practice_areas(is_active);
CREATE INDEX IF NOT EXISTS idx_practice_areas_created_by ON public.practice_areas(created_by);

-- Ensure the trigger exists for updating updated_at
CREATE OR REPLACE FUNCTION update_practice_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS trigger_update_practice_areas_updated_at ON public.practice_areas;
CREATE TRIGGER trigger_update_practice_areas_updated_at
    BEFORE UPDATE ON public.practice_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_practice_areas_updated_at();

-- Ensure RLS is enabled
ALTER TABLE public.practice_areas ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Allow authenticated users to read practice areas" ON public.practice_areas;
DROP POLICY IF EXISTS "Allow authenticated users to create practice areas" ON public.practice_areas;
DROP POLICY IF EXISTS "Allow authenticated users to update practice areas" ON public.practice_areas;
DROP POLICY IF EXISTS "Allow authenticated users to delete practice areas" ON public.practice_areas;

-- Create policies for practice areas
CREATE POLICY "Allow authenticated users to read practice areas" ON public.practice_areas
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to create practice areas" ON public.practice_areas
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update practice areas" ON public.practice_areas
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete practice areas" ON public.practice_areas
    FOR DELETE USING (auth.role() = 'authenticated'); 