-- Add policy to allow public users to create appointments
-- Migration: 20250626080001_add_public_appointment_policy.sql

-- Allow public users to create appointments (for the contact form)
CREATE POLICY "Public users can create appointments" ON public.appointments
    FOR INSERT WITH CHECK (true);

-- Also allow public users to view practice areas (for the dropdown)
CREATE POLICY "Public users can view practice areas" ON public.practice_areas
    FOR SELECT USING (true);

-- And allow public users to view time slots (for the time selection)
CREATE POLICY "Public users can view time slots" ON public.time_slots
    FOR SELECT USING (true); 