-- Create blog_post_files table
CREATE TABLE IF NOT EXISTS blog_post_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_post_files_blog_post_id ON blog_post_files(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_files_file_type ON blog_post_files(file_type);
CREATE INDEX IF NOT EXISTS idx_blog_post_files_created_at ON blog_post_files(created_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_post_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_blog_post_files_updated_at
    BEFORE UPDATE ON blog_post_files
    FOR EACH ROW
    EXECUTE FUNCTION update_blog_post_files_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE blog_post_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for reading files (public can read files of published posts, authors can read their own)
CREATE POLICY "Public can read files of published blog posts" ON blog_post_files
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM blog_posts 
            WHERE blog_posts.id = blog_post_files.blog_post_id 
            AND (blog_posts.status = 'published' OR blog_posts.author_id = auth.uid())
        )
    );

-- Policy for inserting files (authors can add files to their own posts)
CREATE POLICY "Authors can add files to their own blog posts" ON blog_post_files
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM blog_posts 
            WHERE blog_posts.id = blog_post_files.blog_post_id 
            AND blog_posts.author_id = auth.uid()
        )
    );

-- Policy for updating files (authors can update files of their own posts)
CREATE POLICY "Authors can update files of their own blog posts" ON blog_post_files
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM blog_posts 
            WHERE blog_posts.id = blog_post_files.blog_post_id 
            AND blog_posts.author_id = auth.uid()
        )
    );

-- Policy for deleting files (authors can delete files of their own posts)
CREATE POLICY "Authors can delete files of their own blog posts" ON blog_post_files
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM blog_posts 
            WHERE blog_posts.id = blog_post_files.blog_post_id 
            AND blog_posts.author_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON blog_post_files TO authenticated;
GRANT SELECT ON blog_post_files TO anon; 