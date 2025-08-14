-- Migration: Fix practice_areas table schema
-- Add title column if it doesn't exist and ensure proper structure

-- Add title column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_areas' AND column_name = 'title') THEN
        ALTER TABLE practice_areas ADD COLUMN title TEXT;
        
        -- Copy data from name to title if name exists
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_areas' AND column_name = 'name') THEN
            UPDATE practice_areas SET title = name WHERE title IS NULL;
        END IF;
        
        -- Make title NOT NULL after copying data
        ALTER TABLE practice_areas ALTER COLUMN title SET NOT NULL;
    END IF;
END $$;

-- Add created_by column if it doesn't exist (for tracking who created the practice area)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'practice_areas' AND column_name = 'created_by') THEN
        ALTER TABLE practice_areas ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Ensure is_active has a default value
ALTER TABLE practice_areas ALTER COLUMN is_active SET DEFAULT true;

-- Add an index on is_active for better query performance
CREATE INDEX IF NOT EXISTS idx_practice_areas_is_active ON practice_areas(is_active);

-- Add an index on title for better query performance
CREATE INDEX IF NOT EXISTS idx_practice_areas_title ON practice_areas(title);
