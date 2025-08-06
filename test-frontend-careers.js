// Test script to simulate frontend careers API call
const { createClient } = require('@supabase/supabase-js');

// Simulate the frontend environment variables
const supabaseUrl = 'https://szbjuskqrfthmjehknly.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFrontendCareersAPI() {
  console.log('Testing Frontend Careers API...');
  
  try {
    // Simulate the exact API call from the frontend
    console.log('\n1. Testing frontend API call...');
    
    const queryParams = new URLSearchParams();
    queryParams.append('status', 'published');
    queryParams.append('limit', '50');
    
    const response = await fetch(
      `${supabaseUrl}/functions/v1/get-job-postings?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Frontend API call successful');
      console.log('Jobs found:', result.data?.length || 0);
      if (result.data && result.data.length > 0) {
        console.log('Sample jobs:');
        result.data.forEach((job, index) => {
          console.log(`  ${index + 1}. ${job.title} (${job.status})`);
        });
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Frontend API call failed:', response.status, errorText);
    }
    
    // Test 2: Direct RPC call (fallback)
    console.log('\n2. Testing direct RPC call...');
    const { data: jobs, error } = await supabase.rpc('get_job_postings', {
      limit_count: 50,
      offset_count: 0,
      status_filter: 'published',
      department_filter: null,
      experience_filter: null,
      employment_type_filter: null
    });
    
    if (error) {
      console.error('Direct RPC error:', error);
    } else {
      console.log('✅ Direct RPC call successful');
      console.log('Jobs found:', jobs?.length || 0);
      if (jobs && jobs.length > 0) {
        console.log('Sample jobs:');
        jobs.forEach((job, index) => {
          console.log(`  ${index + 1}. ${job.title} (${job.status})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFrontendCareersAPI(); 