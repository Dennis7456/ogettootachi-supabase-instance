-- Add sample contact messages (public submissions)
INSERT INTO contact_messages (name, email, phone, subject, message, practice_area, status, priority) VALUES
('Sarah Johnson', 'sarah.johnson@email.com', '+254-712-345-678', 'Divorce Consultation Request', 'I need urgent legal advice regarding my divorce proceedings. My husband has been hiding assets and I need help with property division. Can we schedule a consultation as soon as possible?', 'Family Law', 'new', 'high'),
('Michael Ochieng', 'michael.ochieng@business.com', '+254-723-456-789', 'Business Contract Review', 'I''m starting a new business partnership and need legal assistance to review and draft contracts. We''re planning to register the company next month. Please advise on the best legal structure.', 'Corporate Law', 'read', 'normal'),
('Grace Wanjiku', 'grace.wanjiku@email.com', '+254-734-567-890', 'Employment Dispute', 'I was unfairly terminated from my job after 5 years of service. They gave no proper notice and refused to pay my severance. I need help filing a wrongful termination case.', 'Employment Law', 'in_progress', 'urgent'),
('David Mwangi', 'david.mwangi@email.com', '+254-745-678-901', 'Property Dispute', 'I have a dispute with my neighbor over property boundaries. They have encroached on my land and built a fence. I need legal representation to resolve this matter.', 'Property Law', 'resolved', 'normal'),
('Elizabeth Akinyi', 'elizabeth.akinyi@email.com', '+254-756-789-012', 'Criminal Defense Consultation', 'My son has been charged with a criminal offense and I need legal representation. This is his first offense and I''m very concerned. Please help us understand our options.', 'Criminal Law', 'new', 'high');

-- Get staff member IDs for assignments
DO $$
DECLARE
    admin_id uuid;
    zacharia_id uuid;
    ann_id uuid;
    lorna_id uuid;
    samson_id uuid;
BEGIN
    -- Get staff member IDs
    SELECT id INTO admin_id FROM profiles WHERE full_name = 'Test Admin User' LIMIT 1;
    SELECT id INTO zacharia_id FROM profiles WHERE full_name = 'Zacharia Ogeka' LIMIT 1;
    SELECT id INTO ann_id FROM profiles WHERE full_name = 'Ann Kamau' LIMIT 1;
    SELECT id INTO lorna_id FROM profiles WHERE full_name = 'Lorna Maryvin' LIMIT 1;
    SELECT id INTO samson_id FROM profiles WHERE full_name = 'Samson Mmbusia' LIMIT 1;

    -- Update contact messages with assignments
    UPDATE contact_messages SET 
        assigned_to = zacharia_id,
        read_at = NOW() - INTERVAL '3 days'
    WHERE email = 'michael.ochieng@business.com';

    UPDATE contact_messages SET 
        assigned_to = ann_id,
        read_at = NOW() - INTERVAL '2 days'
    WHERE email = 'grace.wanjiku@email.com';

    UPDATE contact_messages SET 
        assigned_to = lorna_id,
        read_at = NOW() - INTERVAL '5 days',
        replied_at = NOW() - INTERVAL '3 days'
    WHERE email = 'david.mwangi@email.com';

    UPDATE contact_messages SET 
        assigned_to = admin_id,
        status = 'in_progress',
        replied_at = NOW()
    WHERE email = 'sarah.johnson@email.com';

    UPDATE contact_messages SET 
        assigned_to = samson_id,
        status = 'in_progress',
        replied_at = NOW()
    WHERE email = 'elizabeth.akinyi@email.com';
END $$;

-- Add sample appointments
INSERT INTO appointments (client_name, client_email, client_phone, practice_area, preferred_date, preferred_time, message, status, appointment_type, duration_minutes, meeting_link) VALUES
('Sarah Johnson', 'sarah.johnson@email.com', '+254-712-345-678', 'Family Law', CURRENT_DATE + INTERVAL '2 days', '14:00', 'Urgent divorce consultation - asset hiding case', 'confirmed', 'Initial Consultation', 90, 'https://meet.google.com/abc-defg-hij'),
('Michael Ochieng', 'michael.ochieng@business.com', '+254-723-456-789', 'Corporate Law', CURRENT_DATE + INTERVAL '5 days', '10:00', 'Business partnership contract review and company registration', 'pending', 'Initial Consultation', 60, NULL),
('Grace Wanjiku', 'grace.wanjiku@email.com', '+254-734-567-890', 'Employment Law', CURRENT_DATE + INTERVAL '7 days', '15:30', 'Wrongful termination case - need to review documents', 'confirmed', 'Document Review', 45, 'https://meet.google.com/xyz-uvw-rst'),
('David Mwangi', 'david.mwangi@email.com', '+254-745-678-901', 'Property Law', CURRENT_DATE + INTERVAL '1 day', '11:00', 'Sign settlement documents for property boundary dispute', 'confirmed', 'Document Signing', 30, NULL),
('Elizabeth Akinyi', 'elizabeth.akinyi@email.com', '+254-756-789-012', 'Criminal Law', CURRENT_DATE + INTERVAL '3 days', '16:00', 'Criminal defense consultation for son''s first offense', 'pending', 'Initial Consultation', 90, NULL),
('John Kamau', 'john.kamau@email.com', '+254-767-890-123', 'Family Law', CURRENT_DATE + INTERVAL '4 days', '09:00', 'Child custody modification request', 'confirmed', 'Follow-up Consultation', 60, 'https://meet.google.com/def-ghi-jkl'),
('Mary Wambui', 'mary.wambui@email.com', '+254-778-901-234', 'Corporate Law', CURRENT_DATE + INTERVAL '6 days', '13:00', 'Merger and acquisition legal advice', 'pending', 'Initial Consultation', 120, NULL),
('Peter Njoroge', 'peter.njoroge@email.com', '+254-789-012-345', 'Employment Law', CURRENT_DATE + INTERVAL '8 days', '14:30', 'Severance package negotiation', 'confirmed', 'Negotiation Session', 75, 'https://meet.google.com/mno-pqr-stu'),
('Jane Muthoni', 'jane.muthoni@email.com', '+254-790-123-456', 'Property Law', CURRENT_DATE + INTERVAL '9 days', '10:30', 'Commercial lease agreement review', 'pending', 'Document Review', 60, NULL),
('Robert Ochieng', 'robert.ochieng@email.com', '+254-701-234-567', 'Criminal Law', CURRENT_DATE + INTERVAL '10 days', '15:00', 'Traffic violation appeal hearing preparation', 'confirmed', 'Case Preparation', 45, 'https://meet.google.com/vwx-yz1-234');

-- Assign appointments to staff members
DO $$
DECLARE
    admin_id uuid;
    zacharia_id uuid;
    ann_id uuid;
    lorna_id uuid;
    samson_id uuid;
BEGIN
    -- Get staff member IDs
    SELECT id INTO admin_id FROM profiles WHERE full_name = 'Test Admin User' LIMIT 1;
    SELECT id INTO zacharia_id FROM profiles WHERE full_name = 'Zacharia Ogeka' LIMIT 1;
    SELECT id INTO ann_id FROM profiles WHERE full_name = 'Ann Kamau' LIMIT 1;
    SELECT id INTO lorna_id FROM profiles WHERE full_name = 'Lorna Maryvin' LIMIT 1;
    SELECT id INTO samson_id FROM profiles WHERE full_name = 'Samson Mmbusia' LIMIT 1;

    -- Assign appointments to staff members
    UPDATE appointments SET assigned_to = admin_id WHERE client_email IN ('sarah.johnson@email.com', 'john.kamau@email.com');
    UPDATE appointments SET assigned_to = zacharia_id WHERE client_email IN ('michael.ochieng@business.com', 'mary.wambui@email.com');
    UPDATE appointments SET assigned_to = ann_id WHERE client_email IN ('grace.wanjiku@email.com', 'peter.njoroge@email.com');
    UPDATE appointments SET assigned_to = lorna_id WHERE client_email IN ('david.mwangi@email.com', 'jane.muthoni@email.com');
    UPDATE appointments SET assigned_to = samson_id WHERE client_email IN ('elizabeth.akinyi@email.com', 'robert.ochieng@email.com');
END $$;

-- Add sample internal message replies
DO $$
DECLARE
    admin_id uuid;
    zacharia_id uuid;
    ann_id uuid;
    lorna_id uuid;
    samson_id uuid;
    business_msg_id uuid;
    employment_msg_id uuid;
    property_msg_id uuid;
    divorce_msg_id uuid;
    criminal_msg_id uuid;
BEGIN
    -- Get staff member IDs
    SELECT id INTO admin_id FROM profiles WHERE full_name = 'Test Admin User' LIMIT 1;
    SELECT id INTO zacharia_id FROM profiles WHERE full_name = 'Zacharia Ogeka' LIMIT 1;
    SELECT id INTO ann_id FROM profiles WHERE full_name = 'Ann Kamau' LIMIT 1;
    SELECT id INTO lorna_id FROM profiles WHERE full_name = 'Lorna Maryvin' LIMIT 1;
    SELECT id INTO samson_id FROM profiles WHERE full_name = 'Samson Mmbusia' LIMIT 1;

    -- Get message IDs
    SELECT id INTO business_msg_id FROM contact_messages WHERE email = 'michael.ochieng@business.com' LIMIT 1;
    SELECT id INTO employment_msg_id FROM contact_messages WHERE email = 'grace.wanjiku@email.com' LIMIT 1;
    SELECT id INTO property_msg_id FROM contact_messages WHERE email = 'david.mwangi@email.com' LIMIT 1;
    SELECT id INTO divorce_msg_id FROM contact_messages WHERE email = 'sarah.johnson@email.com' LIMIT 1;
    SELECT id INTO criminal_msg_id FROM contact_messages WHERE email = 'elizabeth.akinyi@email.com' LIMIT 1;

    -- Insert message replies
    INSERT INTO message_replies (message_id, sender_id, sender_name, sender_email, reply_subject, reply_content) VALUES
    (business_msg_id, zacharia_id, 'Zacharia Ogeka', 'zacharia.ogeka@ogettootachi.com', 'Re: Business Contract Review - Next Steps', 'Dear Michael,

Thank you for reaching out regarding your business partnership. I''d be happy to assist you with contract review and company registration.

I recommend we schedule a consultation to discuss:
- Business structure options (LLC, Partnership, etc.)
- Partnership agreement terms
- Registration requirements
- Tax implications

Please let me know your preferred time for a meeting.

Best regards,
Zacharia Ogeka
Senior Corporate Attorney'),
    (employment_msg_id, ann_id, 'Ann Kamau', 'ann.kamau@ogettootachi.com', 'Re: Employment Dispute - Initial Assessment', 'Dear Grace,

I understand this is a difficult situation. Based on your description, you may have a strong case for wrongful termination.

To proceed, I''ll need:
- Your employment contract
- Termination letter
- Pay stubs for the last 6 months
- Any correspondence with your employer

I''ve scheduled a consultation for next week. Please bring these documents.

Regards,
Ann Kamau
Employment Law Specialist'),
    (property_msg_id, lorna_id, 'Lorna Maryvin', 'lorna.maryvin@ogettootachi.com', 'Re: Property Dispute - Resolution Update', 'Dear David,

Great news! I''ve successfully negotiated with your neighbor''s attorney. They have agreed to:
- Remove the encroaching fence
- Pay for survey costs
- Sign a boundary agreement

The settlement documents are ready for your review. Please come to the office to sign them.

Best regards,
Lorna Maryvin
Property Law Attorney'),
    (divorce_msg_id, admin_id, 'Test Admin User', 'admin@ogettootachi.com', 'Re: Divorce Consultation - Urgent Response', 'Dear Sarah,

I understand the urgency of your situation. Asset hiding in divorce cases requires immediate legal intervention.

I recommend:
- Filing for emergency injunctions
- Documenting all assets immediately
- Hiring a forensic accountant

I''ve cleared my schedule for tomorrow. Can you come in at 2 PM?

Regards,
Test Admin User
Managing Partner'),
    (criminal_msg_id, samson_id, 'Samson Mmbusia', 'samson.mmbusia@ogettootachi.com', 'Re: Criminal Defense Consultation - Initial Response', 'Dear Elizabeth,

I understand your concern for your son. First-time offenses often have favorable outcomes with proper legal representation.

I need to know:
- The specific charges
- When the incident occurred
- Any previous interactions with law enforcement
- Whether he has been arraigned

Please call me immediately at 0712-000-000 for a confidential discussion.

Regards,
Samson Mmbusia
Criminal Defense Attorney');
END $$;

-- Display summary
SELECT 
    'Contact Messages' as table_name,
    COUNT(*) as count
FROM contact_messages
UNION ALL
SELECT 
    'Message Replies' as table_name,
    COUNT(*) as count
FROM message_replies
UNION ALL
SELECT 
    'Appointments' as table_name,
    COUNT(*) as count
FROM appointments;
