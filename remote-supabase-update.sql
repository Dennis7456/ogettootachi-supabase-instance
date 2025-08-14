-- Update Remote Supabase Database
-- Run these commands in the Supabase SQL Editor

-- 1. Create missing tables
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    status TEXT DEFAULT 'draft',
    author_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    file_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    message TEXT,
    type TEXT,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add RLS policies for new tables
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow public read access to blog_posts
CREATE POLICY "Allow public read access" ON blog_posts FOR SELECT TO anon, authenticated USING (true);

-- Allow public read access to job_postings
CREATE POLICY "Allow public read access" ON job_postings FOR SELECT TO anon, authenticated USING (true);

-- Allow public read access to documents
CREATE POLICY "Allow public read access" ON documents FOR SELECT TO anon, authenticated USING (true);

-- Allow authenticated users to read notifications
CREATE POLICY "Allow authenticated read access" ON notifications FOR SELECT TO authenticated USING (true);

-- 3. Add sample data
INSERT INTO blog_posts (title, content, status) VALUES 
('Legal Tips for Small Businesses', 'Content here...', 'published'),
('Understanding Contract Law', 'Content here...', 'published'),
('Employment Law Basics', 'Content here...', 'published')
ON CONFLICT DO NOTHING;

INSERT INTO job_postings (title, description, status) VALUES 
('Senior Legal Associate', 'We are looking for an experienced legal associate to join our team.', 'active'),
('Legal Intern', 'Internship opportunity for law students.', 'active'),
('Paralegal', 'Experienced paralegal needed for busy law firm.', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO documents (title, file_path) VALUES 
('Legal Contract Template', '/documents/contract-template.pdf'),
('Client Agreement Form', '/documents/client-agreement.pdf'),
('Legal Procedures Manual', '/documents/procedures-manual.pdf')
ON CONFLICT DO NOTHING;

-- 4. Verify the data
SELECT 'contact_messages' as table_name, COUNT(*) as record_count FROM contact_messages
UNION ALL
SELECT 'blog_posts', COUNT(*) FROM blog_posts
UNION ALL
SELECT 'job_postings', COUNT(*) FROM job_postings
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;
