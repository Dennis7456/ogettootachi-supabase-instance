-- Create practice_areas table
CREATE TABLE IF NOT EXISTS public.practice_areas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_practice_areas_is_active ON public.practice_areas(is_active);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_practice_areas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_practice_areas_updated_at
    BEFORE UPDATE ON public.practice_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_practice_areas_updated_at();

-- Enable Row Level Security
ALTER TABLE public.practice_areas ENABLE ROW LEVEL SECURITY;

-- Create policies for practice areas with IF NOT EXISTS checks
DO $$ 
BEGIN
    -- Allow all authenticated users to read practice areas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'practice_areas' 
        AND policyname = 'Allow authenticated users to read practice areas'
    ) THEN
        CREATE POLICY "Allow authenticated users to read practice areas" ON public.practice_areas
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;

    -- Allow all authenticated users to create practice areas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'practice_areas' 
        AND policyname = 'Allow authenticated users to create practice areas'
    ) THEN
        CREATE POLICY "Allow authenticated users to create practice areas" ON public.practice_areas
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;

    -- Allow all authenticated users to update practice areas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'practice_areas' 
        AND policyname = 'Allow authenticated users to update practice areas'
    ) THEN
        CREATE POLICY "Allow authenticated users to update practice areas" ON public.practice_areas
            FOR UPDATE USING (auth.role() = 'authenticated');
    END IF;

    -- Allow all authenticated users to delete practice areas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'practice_areas' 
        AND policyname = 'Allow authenticated users to delete practice areas'
    ) THEN
        CREATE POLICY "Allow authenticated users to delete practice areas" ON public.practice_areas
            FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$; 