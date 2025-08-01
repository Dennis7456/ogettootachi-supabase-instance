-- Add missing columns to appointments table
-- Add appointment_type with default value
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS appointment_type text DEFAULT 'Initial Consultation';

-- Add duration_minutes with default value of 60 minutes
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS duration_minutes integer DEFAULT 60;

-- Add meeting_link for virtual meeting URLs
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS meeting_link text;

-- Add updated_by to track who last modified the appointment
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- Add comments for documentation
COMMENT ON COLUMN public.appointments.appointment_type IS 'Type of appointment (e.g., Initial Consultation, Follow-up, etc.)';
COMMENT ON COLUMN public.appointments.duration_minutes IS 'Duration of the appointment in minutes';
COMMENT ON COLUMN public.appointments.meeting_link IS 'URL for virtual meetings';
COMMENT ON COLUMN public.appointments.updated_by IS 'User ID of who last updated the appointment';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(preferred_date);
CREATE INDEX IF NOT EXISTS idx_appointments_assigned_to ON public.appointments(assigned_to);

-- Update existing rows to set default values
UPDATE public.appointments 
SET 
    appointment_type = 'Initial Consultation',
    duration_minutes = 60
WHERE 
    appointment_type IS NULL OR 
    duration_minutes IS NULL;
