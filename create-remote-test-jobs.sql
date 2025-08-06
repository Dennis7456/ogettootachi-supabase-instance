-- Create test job postings in remote database
INSERT INTO job_postings (
  title, 
  description, 
  requirements, 
  benefits, 
  department, 
  location, 
  employment_type, 
  experience_level, 
  salary_range, 
  status, 
  created_by
) VALUES 
(
  'Senior Legal Associate',
  'We are seeking a highly qualified Senior Legal Associate to join our dynamic legal team. The ideal candidate will have extensive experience in corporate law and litigation.',
  '• Minimum 5 years of experience in corporate law\n• Strong analytical and research skills\n• Excellent written and verbal communication\n• Ability to work independently and as part of a team\n• Licensed to practice law in Kenya',
  '• Competitive salary package\n• Health insurance coverage\n• Professional development opportunities\n• Flexible working arrangements\n• Annual leave and sick leave benefits',
  'Legal',
  'Nairobi',
  'full-time',
  'senior',
  'KSH 250,000 - 350,000',
  'published',
  (SELECT id FROM auth.users LIMIT 1)
),
(
  'Junior Legal Assistant',
  'We are looking for a motivated Junior Legal Assistant to support our legal team with research, document preparation, and administrative tasks.',
  '• Bachelor''s degree in Law or related field\n• Strong organizational skills\n• Proficiency in Microsoft Office\n• Excellent attention to detail\n• Ability to work under pressure',
  '• Competitive entry-level salary\n• Mentorship program\n• Health insurance\n• Professional development support\n• Modern office environment',
  'Legal',
  'Mombasa',
  'full-time',
  'entry',
  'KSH 80,000 - 120,000',
  'published',
  (SELECT id FROM auth.users LIMIT 1)
),
(
  'Corporate Counsel',
  'Join our legal team as a Corporate Counsel specializing in business law, contracts, and regulatory compliance.',
  '• 3+ years of corporate law experience\n• Strong contract drafting skills\n• Knowledge of Kenyan business law\n• Excellent negotiation skills\n• Ability to work with senior management',
  '• Attractive salary package\n• Performance bonuses\n• Comprehensive benefits\n• Career advancement opportunities\n• Work-life balance',
  'Legal',
  'Nairobi',
  'full-time',
  'mid',
  'KSH 180,000 - 250,000',
  'draft',
  (SELECT id FROM auth.users LIMIT 1)
); 