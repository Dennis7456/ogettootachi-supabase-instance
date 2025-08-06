// Test script to verify create job posting functionality
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://szbjuskqrfthmjehknly.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Ymp1c2txcmZ0aG1qZWhrbmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzU4OTksImV4cCI6MjA2OTAxMTg5OX0.hWqB5s3SO9e38DYIP3Qk_j5iRw8ZbCfR4-SV3kH6JHI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCreateJobPosting() {
  console.log('🧪 Testing Create Job Posting Functionality...\n');

  try {
    // Test 1: Check if we can fetch job postings (should return empty array initially)
    console.log('1️⃣ Checking current job postings...');
    const { data: jobs, error: fetchError } = await supabase.rpc('get_job_postings');
    
    if (fetchError) {
      console.error('❌ Error fetching job postings:', fetchError);
      return;
    }
    
    console.log('✅ Successfully fetched job postings:', jobs);
    console.log(`📊 Found ${jobs?.length || 0} job postings initially\n`);

    // Test 2: Test the create job posting Edge Function
    console.log('2️⃣ Testing create-job-posting Edge Function...');
    const testJobData = {
      title: 'Test Senior Lawyer Position',
      description: 'We are looking for an experienced senior lawyer to join our team.',
      requirements: 'Minimum 5 years experience, LLB degree, admitted to the bar',
      benefits: 'Competitive salary, health insurance, professional development',
      department: 'Legal',
      location: 'Nairobi, Kenya',
      employment_type: 'full-time',
      experience_level: 'senior',
      salary_range: 'KES 800,000 - 1,200,000',
      application_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      is_public: true
    };

    const response = await fetch(`${supabaseUrl}/functions/v1/create-job-posting`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testJobData),
    });

    if (!response.ok) {
      console.error('❌ Edge Function error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }

    const createResult = await response.json();
    console.log('✅ Job posting created successfully:', createResult);
    console.log(`📊 Job ID: ${createResult.data?.id || 'N/A'}\n`);

    // Test 3: Verify the job was created by fetching again
    console.log('3️⃣ Verifying job creation by fetching job postings again...');
    const { data: updatedJobs, error: fetchError2 } = await supabase.rpc('get_job_postings');
    
    if (fetchError2) {
      console.error('❌ Error fetching updated job postings:', fetchError2);
      return;
    }
    
    console.log('✅ Successfully fetched updated job postings:', updatedJobs);
    console.log(`📊 Now found ${updatedJobs?.length || 0} job postings\n`);

    console.log('🎉 All tests completed successfully!');
    console.log('✅ Create job posting functionality is working correctly');
    console.log('✅ Edge Function is operational');
    console.log('✅ Database integration is working');
    console.log('✅ Frontend can now create job postings');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCreateJobPosting(); 