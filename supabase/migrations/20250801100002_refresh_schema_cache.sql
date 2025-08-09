-- Force schema cache refresh for appointments table
-- This migration ensures PostgREST recognizes the appointment_type column

-- First, let's make sure the appointment_type column exists and is properly defined
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS appointment_type text DEFAULT 'Initial Consultation';

-- Update any existing rows that might have NULL values
UPDATE public.appointments 
SET appointment_type = 'Initial Consultation' 
WHERE appointment_type IS NULL;

-- Add a comment to the column for better documentation
COMMENT ON COLUMN public.appointments.appointment_type IS 'Type of appointment (e.g., Initial Consultation, Follow-up, etc.)';

-- Force a schema cache refresh by adding a temporary column and removing it
-- This triggers PostgREST to reload the schema
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS temp_schema_refresh boolean DEFAULT false;
ALTER TABLE public.appointments DROP COLUMN IF EXISTS temp_schema_refresh;

-- Add an index on appointment_type for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_type ON public.appointments(appointment_type);
