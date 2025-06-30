-- Create appointments tables
-- Migration: 20250626030000_create_appointments_tables.sql

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50),
    practice_area VARCHAR(100) NOT NULL,
    preferred_date DATE NOT NULL,
    preferred_time TIME NOT NULL,
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    assigned_to UUID REFERENCES public.profiles(id),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create practice areas table for reference
CREATE TABLE IF NOT EXISTS public.practice_areas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create time slots table for reference
CREATE TABLE IF NOT EXISTS public.time_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(start_time, end_time, day_of_week)
);

-- Insert default practice areas
INSERT INTO public.practice_areas (name, description) VALUES
    ('Corporate Law', 'Business law, contracts, mergers and acquisitions'),
    ('Employment Law', 'Workplace disputes, contracts, discrimination'),
    ('Real Estate', 'Property transactions, disputes, development'),
    ('Family Law', 'Divorce, custody, adoption'),
    ('Criminal Law', 'Criminal defense, prosecution'),
    ('Intellectual Property', 'Patents, trademarks, copyrights'),
    ('Tax Law', 'Tax planning, disputes, compliance'),
    ('Environmental Law', 'Environmental compliance, disputes'),
    ('Immigration Law', 'Visa applications, citizenship, deportation'),
    ('Personal Injury', 'Accidents, medical malpractice, negligence')
ON CONFLICT (name) DO NOTHING;

-- Insert default time slots (9 AM to 5 PM, Monday to Friday)
INSERT INTO public.time_slots (start_time, end_time, day_of_week) VALUES
    ('09:00:00', '09:30:00', 1), ('09:30:00', '10:00:00', 1), ('10:00:00', '10:30:00', 1), ('10:30:00', '11:00:00', 1),
    ('11:00:00', '11:30:00', 1), ('11:30:00', '12:00:00', 1), ('12:00:00', '12:30:00', 1), ('12:30:00', '13:00:00', 1),
    ('13:00:00', '13:30:00', 1), ('13:30:00', '14:00:00', 1), ('14:00:00', '14:30:00', 1), ('14:30:00', '15:00:00', 1),
    ('15:00:00', '15:30:00', 1), ('15:30:00', '16:00:00', 1), ('16:00:00', '16:30:00', 1), ('16:30:00', '17:00:00', 1),
    
    ('09:00:00', '09:30:00', 2), ('09:30:00', '10:00:00', 2), ('10:00:00', '10:30:00', 2), ('10:30:00', '11:00:00', 2),
    ('11:00:00', '11:30:00', 2), ('11:30:00', '12:00:00', 2), ('12:00:00', '12:30:00', 2), ('12:30:00', '13:00:00', 2),
    ('13:00:00', '13:30:00', 2), ('13:30:00', '14:00:00', 2), ('14:00:00', '14:30:00', 2), ('14:30:00', '15:00:00', 2),
    ('15:00:00', '15:30:00', 2), ('15:30:00', '16:00:00', 2), ('16:00:00', '16:30:00', 2), ('16:30:00', '17:00:00', 2),
    
    ('09:00:00', '09:30:00', 3), ('09:30:00', '10:00:00', 3), ('10:00:00', '10:30:00', 3), ('10:30:00', '11:00:00', 3),
    ('11:00:00', '11:30:00', 3), ('11:30:00', '12:00:00', 3), ('12:00:00', '12:30:00', 3), ('12:30:00', '13:00:00', 3),
    ('13:00:00', '13:30:00', 3), ('13:30:00', '14:00:00', 3), ('14:00:00', '14:30:00', 3), ('14:30:00', '15:00:00', 3),
    ('15:00:00', '15:30:00', 3), ('15:30:00', '16:00:00', 3), ('16:00:00', '16:30:00', 3), ('16:30:00', '17:00:00', 3),
    
    ('09:00:00', '09:30:00', 4), ('09:30:00', '10:00:00', 4), ('10:00:00', '10:30:00', 4), ('10:30:00', '11:00:00', 4),
    ('11:00:00', '11:30:00', 4), ('11:30:00', '12:00:00', 4), ('12:00:00', '12:30:00', 4), ('12:30:00', '13:00:00', 4),
    ('13:00:00', '13:30:00', 4), ('13:30:00', '14:00:00', 4), ('14:00:00', '14:30:00', 4), ('14:30:00', '15:00:00', 4),
    ('15:00:00', '15:30:00', 4), ('15:30:00', '16:00:00', 4), ('16:00:00', '16:30:00', 4), ('16:30:00', '17:00:00', 4),
    
    ('09:00:00', '09:30:00', 5), ('09:30:00', '10:00:00', 5), ('10:00:00', '10:30:00', 5), ('10:30:00', '11:00:00', 5),
    ('11:00:00', '11:30:00', 5), ('11:30:00', '12:00:00', 5), ('12:00:00', '12:30:00', 5), ('12:30:00', '13:00:00', 5),
    ('13:00:00', '13:30:00', 5), ('13:30:00', '14:00:00', 5), ('14:00:00', '14:30:00', 5), ('14:30:00', '15:00:00', 5),
    ('15:00:00', '15:30:00', 5), ('15:30:00', '16:00:00', 5), ('16:00:00', '16:30:00', 5), ('16:30:00', '17:00:00', 5)
ON CONFLICT (start_time, end_time, day_of_week) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(preferred_date);
CREATE INDEX IF NOT EXISTS idx_appointments_assigned_to ON public.appointments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_appointments_created_by ON public.appointments(created_by);
CREATE INDEX IF NOT EXISTS idx_appointments_email ON public.appointments(client_email);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for appointments table
DROP TRIGGER IF EXISTS trigger_appointments_updated_at ON public.appointments;
CREATE TRIGGER trigger_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for appointments
-- Admins can do everything
CREATE POLICY "Admins can manage all appointments" ON public.appointments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Staff can view and update appointments
CREATE POLICY "Staff can view and update appointments" ON public.appointments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Staff can update appointments" ON public.appointments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'staff')
        )
    );

-- Staff can create appointments
CREATE POLICY "Staff can create appointments" ON public.appointments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'staff')
        )
    );

-- Users can view their own appointments (if we implement client accounts later)
CREATE POLICY "Users can view own appointments" ON public.appointments
    FOR SELECT USING (
        client_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- RLS policies for practice areas (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view practice areas" ON public.practice_areas
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS policies for time slots (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view time slots" ON public.time_slots
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create functions for appointment management
CREATE OR REPLACE FUNCTION public.get_available_time_slots(
    appointment_date DATE,
    practice_area_id UUID DEFAULT NULL
)
RETURNS TABLE (
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ts.start_time,
        ts.end_time,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM public.appointments a 
                WHERE a.preferred_date = appointment_date 
                AND a.preferred_time = ts.start_time
                AND a.status NOT IN ('cancelled')
            ) THEN false
            ELSE true
        END as is_available
    FROM public.time_slots ts
    WHERE ts.day_of_week = EXTRACT(DOW FROM appointment_date)
    AND ts.is_available = true
    ORDER BY ts.start_time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get appointment statistics
CREATE OR REPLACE FUNCTION public.get_appointment_stats(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_appointments BIGINT,
    pending_appointments BIGINT,
    confirmed_appointments BIGINT,
    completed_appointments BIGINT,
    cancelled_appointments BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_appointments,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_appointments,
        COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_appointments,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_appointments,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_appointments
    FROM public.appointments
    WHERE (start_date IS NULL OR preferred_date >= start_date)
    AND (end_date IS NULL OR preferred_date <= end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.appointments TO authenticated;
GRANT ALL ON public.practice_areas TO authenticated;
GRANT ALL ON public.time_slots TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_time_slots TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_appointment_stats TO authenticated; 