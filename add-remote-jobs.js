// Script to add test jobs to the remote database
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://szbjuskqrfthmjehknly.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Ymp1c2txcmZ0aG1qZWhrbmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzU4OTksImV4cCI6MjA2OTAxMTg5OX0.hWqB5s3SO9e38DYIP3Qk_j5iRw8ZbCfR4-SV3kH6JHI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addRemoteJobs() {
  console.log('Adding test jobs to remote database...');
  
  try {
    // First, let's check if there are any users in the database
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id')
      .limit(1);
    
    if (usersError) {
      console.log('Could not get users, will use null for created_by');
    }
    
    const createdBy = users && users.length > 0 ? users[0].id : null;
    
    // Add test jobs
    const testJobs = [
      {
        title: 'Senior Legal Associate',
        description: 'We are seeking a highly qualified Senior Legal Associate to join our dynamic legal team. The ideal candidate will have extensive experience in corporate law and litigation.',
        requirements: '• Minimum 5 years of experience in corporate law\n• Strong analytical and research skills\n• Excellent written and verbal communication\n• Ability to work independently and as part of a team\n• Licensed to practice law in Kenya',
        benefits: '• Competitive salary package\n• Health insurance coverage\n• Professional development opportunities\n• Flexible working arrangements\n• Annual leave and sick leave benefits',
        department: 'Legal',
        location: 'Nairobi',
        employment_type: 'full-time',
        experience_level: 'senior',
        salary_range: 'KSH 250,000 - 350,000',
        status: 'published',
        created_by: createdBy
      },
      {
        title: 'Junior Legal Assistant',
        description: 'We are looking for a motivated Junior Legal Assistant to support our legal team with research, document preparation, and administrative tasks.',
        requirements: '• Bachelor\'s degree in Law or related field\n• Strong organizational skills\n• Proficiency in Microsoft Office\n• Excellent attention to detail\n• Ability to work under pressure',
        benefits: '• Competitive entry-level salary\n• Mentorship program\n• Health insurance\n• Professional development support\n• Modern office environment',
        department: 'Legal',
        location: 'Mombasa',
        employment_type: 'full-time',
        experience_level: 'entry',
        salary_range: 'KSH 80,000 - 120,000',
        status: 'published',
        created_by: createdBy
      },
      {
        title: 'Corporate Counsel',
        description: 'Join our legal team as a Corporate Counsel specializing in business law, contracts, and regulatory compliance.',
        requirements: '• 3+ years of corporate law experience\n• Strong contract drafting skills\n• Knowledge of Kenyan business law\n• Excellent negotiation skills\n• Ability to work with senior management',
        benefits: '• Attractive salary package\n• Performance bonuses\n• Comprehensive benefits\n• Career advancement opportunities\n• Work-life balance',
        department: 'Legal',
        location: 'Nairobi',
        employment_type: 'full-time',
        experience_level: 'mid',
        salary_range: 'KSH 180,000 - 250,000',
        status: 'draft',
        created_by: createdBy
      }
    ];

    // Insert jobs one by one
    for (const job of testJobs) {
      const { data, error } = await supabase
        .from('job_postings')
        .insert(job)
        .select();

      if (error) {
        console.error(`❌ Error adding job "${job.title}":`, error);
      } else {
        console.log(`✅ Successfully added job: ${job.title} (${job.status})`);
      }
    }

    console.log('\n🎉 Finished adding test jobs!');
    
    // Now let's test fetching the published jobs
    console.log('\nTesting fetch of published jobs...');
    const { data: publishedJobs, error: fetchError } = await supabase.rpc('get_job_postings', {
      limit_count: 10,
      offset_count: 0,
      status_filter: 'published',
      department_filter: null,
      experience_filter: null,
      employment_type_filter: null
    });

    if (fetchError) {
      console.error('❌ Error fetching published jobs:', fetchError);
    } else {
      console.log(`✅ Successfully fetched ${publishedJobs?.length || 0} published jobs`);
      if (publishedJobs && publishedJobs.length > 0) {
        publishedJobs.forEach(job => {
          console.log(`  - ${job.title} (${job.status})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Script failed:', error);
  }
}

addRemoteJobs(); 