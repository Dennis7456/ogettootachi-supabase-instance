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