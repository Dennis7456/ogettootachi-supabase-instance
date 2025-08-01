const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addProfessionalImageColumn() {
  try {
    console.log('Adding professional_image column to profiles table...');
    
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE profiles 
        ADD COLUMN IF NOT EXISTS professional_image text;
        
        COMMENT ON COLUMN profiles.professional_image IS 'URL to professional photo/image of the team member';
      `
    });

    if (error) {
      console.error('Error adding column:', error);
      return;
    }

    console.log('✅ Successfully added professional_image column to profiles table');
    
    // Verify the column was added
    const { data, error: selectError } = await supabase
      .from('profiles')
      .select('id, full_name, professional_image')
      .limit(1);

    if (selectError) {
      console.error('Error verifying column:', selectError);
      return;
    }

    console.log('✅ Column verification successful. Sample data:', data);
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

addProfessionalImageColumn(); 