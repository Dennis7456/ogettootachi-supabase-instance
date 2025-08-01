const { createClient } = require('@supabase/supabase-js');

// Remote Supabase configuration
const supabaseUrl = 'https://szbjuskqrfthmjehknly.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Ymp1c2txcmZ0aG1qZWhrbmx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQzNTg5OSwiZXhwIjoyMDY5MDExODk5fQ.cMrSpRsKWhU0OM9wpRtrhOFj-6HHzS-lVOJ91YCnepU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addProfessionalImageColumn() {
  try {
    console.log('Adding professional_image column to remote profiles table...');
    
    // First, check if the column already exists
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('professional_image')
      .limit(1);

    if (!testError) {
      console.log('✅ professional_image column already exists');
      return;
    }

    if (testError.message.includes('column "professional_image" does not exist') || testError.message.includes('column profiles.professional_image does not exist')) {
      console.log('❌ professional_image column does not exist, adding it...');
      
      // Since we can't use exec_sql, we'll need to add the column manually
      // For now, let's provide instructions
      console.log('\n📋 MANUAL SETUP REQUIRED:');
      console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/szbjuskqrfthmjehknly');
      console.log('2. Navigate to Database > Tables > profiles');
      console.log('3. Click "Add column"');
      console.log('4. Set the following values:');
      console.log('   - Name: professional_image');
      console.log('   - Type: text');
      console.log('   - Default Value: null');
      console.log('   - Is Nullable: ✅ (checked)');
      console.log('5. Click "Save"');
      console.log('\nAfter adding the column, run this script again to verify.');
      
      return;
    }

    console.error('Unexpected error:', testError);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addProfessionalImageColumn(); 