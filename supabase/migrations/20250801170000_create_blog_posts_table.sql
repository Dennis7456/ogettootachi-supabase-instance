-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);

-- Create a function to automatically generate slugs
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'))
           || '-' || extract(epoch from now())::text;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically generate slugs
CREATE OR REPLACE FUNCTION set_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        NEW.slug := generate_slug(NEW.title);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_slug
    BEFORE INSERT OR UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION set_slug();

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_blog_posts_updated_at
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies with IF NOT EXISTS checks
DO $$ 
BEGIN
    -- Policy for reading blog posts (public can read published posts, authors can read their own)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'blog_posts' 
        AND policyname = 'Public can read published blog posts'
    ) THEN
        CREATE POLICY "Public can read published blog posts" ON blog_posts
            FOR SELECT USING (status = 'published' OR auth.uid() = author_id);
    END IF;

    -- Policy for inserting blog posts (authenticated users can create posts)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'blog_posts' 
        AND policyname = 'Authenticated users can create blog posts'
    ) THEN
        CREATE POLICY "Authenticated users can create blog posts" ON blog_posts
            FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;

    -- Policy for updating blog posts (authors can update their own posts)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'blog_posts' 
        AND policyname = 'Authors can update their own blog posts'
    ) THEN
        CREATE POLICY "Authors can update their own blog posts" ON blog_posts
            FOR UPDATE USING (auth.uid() = author_id);
    END IF;

    -- Policy for deleting blog posts (authors can delete their own posts)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'blog_posts' 
        AND policyname = 'Authors can delete their own blog posts'
    ) THEN
        CREATE POLICY "Authors can delete their own blog posts" ON blog_posts
            FOR DELETE USING (auth.uid() = author_id);
    END IF;
END $$;

-- Grant permissions
GRANT ALL ON blog_posts TO authenticated;
GRANT SELECT ON blog_posts TO anon; 