-- Add created_by column to appointments table
-- This column tracks which user (admin/staff) created the appointment

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON appointments(created_by);

-- Create RLS policies for appointments table if they don't exist
DO $$ 
BEGIN
    -- Allow authenticated users to view appointments
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND policyname = 'Authenticated users can view appointments'
    ) THEN
        CREATE POLICY "Authenticated users can view appointments" 
        ON appointments FOR SELECT 
        USING (auth.role() = 'authenticated');
    END IF;

    -- Allow admins and staff to insert appointments
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND policyname = 'Admins and staff can create appointments'
    ) THEN
        CREATE POLICY "Admins and staff can create appointments" 
        ON appointments FOR INSERT 
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('admin', 'staff')
            )
        );
    END IF;

    -- Allow admins and staff to update appointments
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND policyname = 'Admins and staff can update appointments'
    ) THEN
        CREATE POLICY "Admins and staff can update appointments" 
        ON appointments FOR UPDATE 
        USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role IN ('admin', 'staff')
            )
        );
    END IF;

    -- Allow admins to delete appointments
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND policyname = 'Admins can delete appointments'
    ) THEN
        CREATE POLICY "Admins can delete appointments" 
        ON appointments FOR DELETE 
        USING (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role = 'admin'
            )
        );
    END IF;
END $$;

-- Enable RLS on appointments table if not already enabled
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;