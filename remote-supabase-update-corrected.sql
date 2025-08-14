-- Update Remote Supabase Database (Corrected)
-- Run these commands in the Supabase SQL Editor

-- 1. Add sample data to existing tables with correct schema

-- Blog posts (already has data, but let's add more if needed)
INSERT INTO blog_posts (title, content, status, excerpt, category, tags, meta_title, meta_description, read_time, is_public) VALUES 
('Legal Tips for Small Businesses', 'Content here...', 'published', 'Essential legal advice for small business owners', 'Business Law', ARRAY['business', 'legal'], 'Legal Tips for Small Businesses', 'Essential legal advice for small business owners', 5, true),
('Understanding Contract Law', 'Content here...', 'published', 'A comprehensive guide to contract law', 'Contract Law', ARRAY['contracts', 'legal'], 'Understanding Contract Law', 'A comprehensive guide to contract law', 8, true),
('Employment Law Basics', 'Content here...', 'published', 'Fundamental employment law principles', 'Employment Law', ARRAY['employment', 'legal'], 'Employment Law Basics', 'Fundamental employment law principles', 6, true)
ON CONFLICT DO NOTHING;

-- Job postings
INSERT INTO job_postings (title, description, status) VALUES 
('Senior Legal Associate', 'We are looking for an experienced legal associate to join our team.', 'active'),
('Legal Intern', 'Internship opportunity for law students.', 'active'),
('Paralegal', 'Experienced paralegal needed for busy law firm.', 'active')
ON CONFLICT DO NOTHING;

-- Documents (using correct columns: title and url)
INSERT INTO documents (title, url) VALUES 
('Legal Contract Template', '/documents/contract-template.pdf'),
('Client Agreement Form', '/documents/client-agreement.pdf'),
('Legal Procedures Manual', '/documents/procedures-manual.pdf')
ON CONFLICT DO NOTHING;

-- Notifications
INSERT INTO notifications (title, message, type) VALUES 
('New Message Received', 'You have received a new contact message.', 'message'),
('Appointment Scheduled', 'A new appointment has been scheduled.', 'appointment')
ON CONFLICT DO NOTHING;

-- 2. Verify the data
SELECT 'contact_messages' as table_name, COUNT(*) as record_count FROM contact_messages
UNION ALL
SELECT 'blog_posts', COUNT(*) FROM blog_posts
UNION ALL
SELECT 'job_postings', COUNT(*) FROM job_postings
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;
