// Test script for file upload functionality
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://szbjuskqrfthmjehknly.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Ymp1c2txcmZ0aG1qZWhrbmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0MzU4OTksImV4cCI6MjA2OTAxMTg5OX0.hWqB5s3SO9e38DYIP3Qk_j5iRw8ZbCfR4-SV3kH6JHI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFileUpload() {
  console.log('Testing file upload functionality...');

  try {
    // Test the Edge Function directly
    const testFile = new File(['Test resume content'], 'test-resume.pdf', {
      type: 'application/pdf'
    });

    const formData = new FormData();
    formData.append('file', testFile);

    const response = await fetch(`${supabaseUrl}/functions/v1/upload-application-file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Upload failed:', errorData);
      return;
    }

    const result = await response.json();
    console.log('✅ Upload successful:', result);

    // Test storage bucket access
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error listing buckets:', bucketError);
    } else {
      console.log('✅ Available buckets:', buckets.map(b => b.name));
      
      const jobApplicationsBucket = buckets.find(b => b.name === 'job-applications');
      if (jobApplicationsBucket) {
        console.log('✅ job-applications bucket exists');
        
        // List files in the bucket
        const { data: files, error: filesError } = await supabase.storage
          .from('job-applications')
          .list();
        
        if (filesError) {
          console.error('❌ Error listing files:', filesError);
        } else {
          console.log('✅ Files in job-applications bucket:', files);
        }
      } else {
        console.log('❌ job-applications bucket not found');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFileUpload(); 