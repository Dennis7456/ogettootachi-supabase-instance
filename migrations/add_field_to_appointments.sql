-- Add missing fields to appointments table

-- Add appointment_type field
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_type TEXT;

-- Add location field
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS location TEXT;

-- Add duration field (in minutes)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration INTEGER;

-- Add confirmation_code field
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS confirmation_code TEXT; 