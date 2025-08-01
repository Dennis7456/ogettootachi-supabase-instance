-- Add appointment_type column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS appointment_type text DEFAULT 'Initial Consultation';

-- Update existing appointments to have a default appointment type
UPDATE public.appointments 
SET appointment_type = 'Initial Consultation' 
WHERE appointment_type IS NULL;
