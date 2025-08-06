-- Add missing policies to blog_posts table if they don't exist
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