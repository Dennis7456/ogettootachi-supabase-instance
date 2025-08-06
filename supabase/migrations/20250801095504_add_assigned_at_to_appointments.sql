-- Add assigned_at column to appointments table
-- This column will track when an appointment was assigned to a staff member
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- Add an index for better performance when querying by assignment date
CREATE INDEX IF NOT EXISTS idx_appointments_assigned_at ON appointments(assigned_at);

-- Add a comment to document the column
COMMENT ON COLUMN appointments.assigned_at IS 'Timestamp when the appointment was assigned to a staff member'; 