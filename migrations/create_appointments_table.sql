-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    practice_area TEXT NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending',
    assigned_to UUID REFERENCES auth.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert appointments
CREATE POLICY "Enable insert for anonymous users" 
ON appointments FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to view all appointments
CREATE POLICY "Enable select for authenticated users" 
ON appointments FOR SELECT 
TO authenticated
USING (true);

-- Allow authenticated users to update appointments
CREATE POLICY "Enable update for authenticated users" 
ON appointments FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON appointments
FOR EACH ROW
EXECUTE FUNCTION update_appointments_updated_at(); 