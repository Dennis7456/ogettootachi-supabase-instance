const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
  console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testProfilesTable() {
  try {
    console.log('Testing profiles table access...');
    console.log('Supabase URL:', supabaseUrl);
    
    // Try to select from profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error accessing profiles table:', error);
      console.log('\nThis suggests the table might not exist or be in a different schema.');
      console.log('Please check your Supabase dashboard for the correct table name.');
      return;
    }

    console.log('✅ Successfully accessed profiles table');
    console.log('Sample data:', data);
    
    // Check if professional_image column exists by trying to select it
    const { data: profData, error: profError } = await supabase
      .from('profiles')
      .select('professional_image')
      .limit(1);

    if (profError) {
      if (profError.message.includes('column "professional_image" does not exist')) {
        console.log('\n❌ professional_image column does not exist');
        console.log('You need to add it manually in the Supabase dashboard');
      } else {
        console.error('Error checking professional_image column:', profError);
      }
    } else {
      console.log('\n✅ professional_image column exists');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testProfilesTable(); 