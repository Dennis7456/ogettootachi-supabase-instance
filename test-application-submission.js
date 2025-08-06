// Test script for application submission
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://szbjuskqrfthmjehknly.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Ymp1c2txcmZ0aG1qZWhrbmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzU4OTksImV4cCI6MjA2OTAxMTg5OX0.hWqB5s3SO9e38DYIP3Qk_j5iRw8ZbCfR4-SV3kH6JHI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testApplicationSubmission() {
  console.log('Testing application submission...');

  try {
    // First, let's get a published job
    const { data: jobs, error: jobsError } = await supabase.rpc('get_job_postings', {
      limit_count: 1,
      offset_count: 0,
      status_filter: 'published',
      department_filter: null,
      experience_filter: null,
      employment_type_filter: null
    });

    if (jobsError) {
      console.error('❌ Error fetching jobs:', jobsError);
      return;
    }

    if (!jobs || jobs.length === 0) {
      console.log('❌ No published jobs found');
      return;
    }

    const job = jobs[0];
    console.log('✅ Found job:', job.title);

    // Test application submission
    const applicationData = {
      job_id: job.id,
      applicant_name: 'Test Applicant',
      applicant_email: 'test@example.com',
      applicant_phone: '+254700000000',
      cover_letter: 'This is a test application with rich text formatting.',
      resume_url: 'https://example.com/test-resume.pdf'
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/submit-application`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(applicationData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Application submission failed:', errorData);
      return;
    }

    const result = await response.json();
    console.log('✅ Application submitted successfully:', result);

    // Test getting applications
    const { data: applications, error: appsError } = await supabase.rpc('get_applications', {
      limit_count: 10,
      offset_count: 0,
      job_id_filter: job.id,
      status_filter: null
    });

    if (appsError) {
      console.error('❌ Error fetching applications:', appsError);
    } else {
      console.log('✅ Applications found:', applications?.length || 0);
      if (applications && applications.length > 0) {
        applications.forEach(app => {
          console.log(`  - ${app.applicant_name} (${app.applicant_email}) - ${app.status}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testApplicationSubmission(); 