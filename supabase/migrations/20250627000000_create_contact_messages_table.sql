-- Create contact_messages table for storing contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    practice_area TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'in_progress', 'resolved', 'archived')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    admin_notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON public.contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_priority ON public.contact_messages(priority);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON public.contact_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_contact_messages_email ON public.contact_messages(email);

-- Enable Row Level Security
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_messages table
-- Allow anyone to insert contact messages (for the contact form)
CREATE POLICY "Allow public to insert contact messages" ON public.contact_messages
    FOR INSERT WITH CHECK (true);

-- Allow authenticated users to view all contact messages
CREATE POLICY "Allow authenticated users to view contact messages" ON public.contact_messages
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to update contact messages
CREATE POLICY "Allow authenticated users to update contact messages" ON public.contact_messages
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete contact messages
CREATE POLICY "Allow authenticated users to delete contact messages" ON public.contact_messages
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contact_messages_updated_at 
    BEFORE UPDATE ON public.contact_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 