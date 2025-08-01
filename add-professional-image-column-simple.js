const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndAddProfessionalImageColumn() {
  try {
    console.log('Checking if professional_image column exists...');
    
    // Try to select the professional_image column to see if it exists
    const { data, error } = await supabase
      .from('profiles')
      .select('professional_image')
      .limit(1);

    if (error) {
      if (error.message.includes('column "professional_image" does not exist')) {
        console.log('❌ professional_image column does not exist');
        console.log('Please add the column manually in the Supabase dashboard:');
        console.log('1. Go to your Supabase project dashboard');
        console.log('2. Navigate to Database > Tables > profiles');
        console.log('3. Click "Add column"');
        console.log('4. Set Name: professional_image');
        console.log('5. Set Type: text');
        console.log('6. Set Default Value: null');
        console.log('7. Click "Save"');
        return;
      } else {
        console.error('Error checking column:', error);
        return;
      }
    }

    console.log('✅ professional_image column already exists');
    console.log('Sample data:', data);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkAndAddProfessionalImageColumn(); 