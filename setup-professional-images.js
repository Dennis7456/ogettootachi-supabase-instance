const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupProfessionalImagesBucket() {
  try {
    console.log('Setting up professional-images bucket and policies...');
    
    // Read the SQL file
    const fs = require('fs');
    const sql = fs.readFileSync('./setup-   professional-images-bucket.sql', 'utf8');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('Error setting up bucket:', error);
      return;
    }

    console.log('✅ Successfully set up professional-images bucket and policies');
    
    // Verify the bucket was created
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('Error listing buckets:', bucketError);
      return;
    }

    const professionalBucket = buckets.find(bucket => bucket.id === 'professional-images');
    if (professionalBucket) {
      console.log('✅ Professional-images bucket found:', professionalBucket);
    } else {
      console.log('❌ Professional-images bucket not found');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

setupProfessionalImagesBucket(); 