-- Add urls JSONB array column to blog_posts for multiple related links (e.g., YouTube)
ALTER TABLE public.blog_posts
ADD COLUMN IF NOT EXISTS urls JSONB DEFAULT '[]'::jsonb;

-- Add constraint to ensure urls is an array (with proper existence check)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'blog_posts_urls_is_array'
    ) THEN
        ALTER TABLE public.blog_posts
        ADD CONSTRAINT blog_posts_urls_is_array
        CHECK (jsonb_typeof(urls) = 'array');
    END IF;
END $$;

COMMENT ON COLUMN public.blog_posts.urls IS 'Array of related URLs (e.g., YouTube, references) stored as JSONB array of strings';


