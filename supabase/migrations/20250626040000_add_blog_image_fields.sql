-- Add image-related fields to blog posts table
ALTER TABLE IF EXISTS public.blog_posts 
ADD COLUMN IF NOT EXISTS image_data JSONB,
ADD COLUMN IF NOT EXISTS image_path TEXT,
ADD COLUMN IF NOT EXISTS image_dimensions JSONB;

-- Add index for image queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_image_path ON public.blog_posts(image_path);

-- Add comment for documentation
COMMENT ON COLUMN public.blog_posts.image_data IS 'Stores complete image metadata including URL, path, dimensions, and file info';
COMMENT ON COLUMN public.blog_posts.image_path IS 'Storage path for the uploaded image';
COMMENT ON COLUMN public.blog_posts.image_dimensions IS 'Image dimensions (width, height, aspect ratio)'; 