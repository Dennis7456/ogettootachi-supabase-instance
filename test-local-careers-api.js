// Test script to verify careers API with local database
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLocalCareersAPI() {
  console.log('Testing Local Careers API...');
  
  try {
    // Test 1: Direct database query
    console.log('\n1. Testing direct database query...');
    const { data: jobs, error } = await supabase.rpc('get_job_postings', {
      limit_count: 10,
      offset_count: 0,
      status_filter: 'published',
      department_filter: null,
      experience_filter: null,
      employment_type_filter: null
    });
    
    if (error) {
      console.error('Database query error:', error);
    } else {
      console.log('✅ Database query successful');
      console.log('Jobs found:', jobs?.length || 0);
      if (jobs && jobs.length > 0) {
        console.log('Sample job:', jobs[0].title);
      }
    }
    
    // Test 2: Edge Function call
    console.log('\n2. Testing Edge Function...');
    const response = await fetch(`${supabaseUrl}/functions/v1/get-job-postings?status=published`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Edge Function successful');
      console.log('Jobs found:', result.data?.length || 0);
      if (result.data && result.data.length > 0) {
        console.log('Sample job:', result.data[0].title);
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Edge Function failed:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testLocalCareersAPI(); 