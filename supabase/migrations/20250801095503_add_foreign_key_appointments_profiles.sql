-- Add foreign key constraint between appointments.assigned_to and profiles.id
-- This will allow the join query in StaffDashboard to work properly

-- First, drop any existing foreign key if it exists
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_assigned_to_fkey;

-- Add the foreign key constraint
ALTER TABLE appointments 
ADD CONSTRAINT appointments_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL;

-- Add an index for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_assigned_to ON appointments(assigned_to); 