-- Add created_by column to practice_areas table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'practice_areas' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE public.practice_areas
        ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_practice_areas_created_by ON public.practice_areas(created_by); 