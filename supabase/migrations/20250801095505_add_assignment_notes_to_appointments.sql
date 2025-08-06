-- Add assignment_notes column to appointments table
-- This column will store notes about the assignment
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS assignment_notes TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN appointments.assignment_notes IS 'Notes about the appointment assignment'; 