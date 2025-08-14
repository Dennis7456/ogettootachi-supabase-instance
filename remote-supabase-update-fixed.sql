-- Update Remote Supabase Database (Fixed)
-- Run these commands in the Supabase SQL Editor

-- 1. Check existing tables first
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('blog_posts', 'job_postings', 'documents', 'notifications');

-- 2. Check the actual schema of documents table
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'documents' AND table_schema = 'public';

-- 3. Add sample data to existing tables (without file_path column)
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

-- 4. Try inserting documents with only title (if file_path doesn't exist)
INSERT INTO documents (title) VALUES 
('Legal Contract Template'),
('Client Agreement Form'),
('Legal Procedures Manual')
ON CONFLICT DO NOTHING;

-- 5. Add notifications (if table exists)
INSERT INTO notifications (title, message, type) VALUES 
('New Message Received', 'You have received a new contact message.', 'message'),
('Appointment Scheduled', 'A new appointment has been scheduled.', 'appointment')
ON CONFLICT DO NOTHING;

-- 6. Verify the data
SELECT 'contact_messages' as table_name, COUNT(*) as record_count FROM contact_messages
UNION ALL
SELECT 'blog_posts', COUNT(*) FROM blog_posts
UNION ALL
SELECT 'job_postings', COUNT(*) FROM job_postings
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;
