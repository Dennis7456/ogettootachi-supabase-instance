-- Add created_by column to practice_areas table
ALTER TABLE public.practice_areas 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_practice_areas_created_by ON public.practice_areas(created_by); 