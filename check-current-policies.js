const { createClient } = require('@supabase/supabase-js');

// Remote Supabase configuration
const supabaseUrl = 'https://szbjuskqrfthmjehknly.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Ymp1c2txcmZ0aG1qZWhrbmx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQzNTg5OSwiZXhwIjoyMDY5MDExODk5fQ.cMrSpRsKWhU0OM9wpRtrhOFj-6HHzS-lVOJ91YCnepU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkCurrentPolicies() {
  try {
    console.log('🔍 Checking current storage policies...');
    
    // Try to get policy information using a different approach
    const { data, error } = await supabase
      .from('information_schema.policies')
      .select('*')
      .eq('table_schema', 'storage')
      .eq('table_name', 'objects')
      .like('policy_name', '%professional%');
    
    if (error) {
      console.log('Could not query policies directly:', error.message);
      console.log('\n📋 MANUAL CHECK REQUIRED:');
      console.log('Please check each policy in your Supabase dashboard and verify:');
      console.log('\n1. Go to Storage > professional-images > Policies');
      console.log('2. Click on each policy and check the "Policy definition" field');
      console.log('3. Make sure they match the exact conditions below:');
      
      console.log('\n✅ CORRECT POLICY DEFINITIONS:');
      console.log('\nPolicy 1 (SELECT):');
      console.log('(bucket_id = \'professional-images\')');
      
      console.log('\nPolicy 2 (INSERT):');
      console.log('(bucket_id = \'professional-images\' AND auth.role() = \'authenticated\' AND (storage.foldername(name))[1] = auth.uid()::text)');
      
      console.log('\nPolicy 3 (UPDATE):');
      console.log('(bucket_id = \'professional-images\' AND auth.role() = \'authenticated\' AND (storage.foldername(name))[1] = auth.uid()::text)');
      
      console.log('\nPolicy 4 (DELETE):');
      console.log('(bucket_id = \'professional-images\' AND auth.role() = \'authenticated\' AND (storage.foldername(name))[1] = auth.uid()::text)');
      
      console.log('\n❌ COMMON ISSUES TO CHECK:');
      console.log('1. Missing bucket_id = \'professional-images\' condition');
      console.log('2. Missing auth.role() = \'authenticated\' condition');
      console.log('3. Missing (storage.foldername(name))[1] = auth.uid()::text condition');
      console.log('4. Wrong bucket name (should be exactly \'professional-images\')');
      console.log('5. Extra UPDATE policies that might conflict');
      
    } else {
      console.log('Current policies:', data);
    }
    
  } catch (error) {
    console.error('Error checking policies:', error);
  }
}

checkCurrentPolicies(); 