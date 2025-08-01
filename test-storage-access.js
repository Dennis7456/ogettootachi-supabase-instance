const { createClient } = require('@supabase/supabase-js');

// Remote Supabase configuration
const supabaseUrl = 'https://szbjuskqrfthmjehknly.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Ymp1c2txcmZ0aG1qZWhrbmx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQzNTg5OSwiZXhwIjoyMDY5MDExODk5fQ.cMrSpRsKWhU0OM9wpRtrhOFj-6HHzS-lVOJ91YCnepU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testStorageAccess() {
  try {
    console.log('🔍 Testing storage access...');
    
    // List all buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error listing buckets:', bucketError);
      return;
    }

    console.log('✅ Available buckets:', buckets.map(b => b.id));
    
    const professionalBucket = buckets.find(bucket => bucket.id === 'professional-images');
    
    if (!professionalBucket) {
      console.error('❌ Professional-images bucket does not exist!');
      return;
    }

    console.log('✅ Professional-images bucket exists:', professionalBucket);
    
    // Try to list files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from('professional-images')
      .list();
    
    if (listError) {
      console.error('❌ Error listing files:', listError);
    } else {
      console.log('✅ Files in bucket:', files);
    }
    
    // Test if we can create a test file (this will fail due to RLS, but we'll see the error)
    console.log('🔄 Testing file creation...');
    const testFile = Buffer.from('test');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('professional-images')
      .upload('test-file.txt', testFile, {
        contentType: 'text/plain'
      });
    
    if (uploadError) {
      console.log('❌ Expected upload error (due to RLS):', uploadError.message);
    } else {
      console.log('✅ Upload succeeded (RLS might be disabled)');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testStorageAccess(); 