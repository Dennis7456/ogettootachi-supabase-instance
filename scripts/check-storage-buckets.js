// Script to check and create storage buckets
import { createClient } from '@supabase/supabase-js';

// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

console.log('=== Check and Create Storage Buckets ===\n');

async function checkAndCreateBuckets() {
  try {
    // Create service role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // List existing buckets
    console.log('1. Checking existing buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError);
      return false;
    }
    
    console.log('Found buckets:', buckets.map(b => b.name));
    
    // Check if documents bucket exists
    const documentsBucket = buckets.find(bucket => bucket.name === 'documents');
    
    if (!documentsBucket) {
      console.log('2. Creating documents bucket...');
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('documents', {
        public: false,
        allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.error('❌ Failed to create documents bucket:', createError);
        return false;
      }
      
      console.log('✅ Documents bucket created:', newBucket);
    } else {
      console.log('✅ Documents bucket already exists');
    }
    
    // Check if public bucket exists
    const publicBucket = buckets.find(bucket => bucket.name === 'public');
    
    if (!publicBucket) {
      console.log('3. Creating public bucket...');
      
      const { data: newPublicBucket, error: createPublicError } = await supabase.storage.createBucket('public', {
        public: true
      });
      
      if (createPublicError) {
        console.error('❌ Failed to create public bucket:', createPublicError);
        return false;
      }
      
      console.log('✅ Public bucket created:', newPublicBucket);
    } else {
      console.log('✅ Public bucket already exists');
    }
    
    // List buckets again to confirm
    console.log('\n4. Final bucket list:');
    const { data: finalBuckets } = await supabase.storage.listBuckets();
    console.log('Available buckets:', finalBuckets.map(b => b.name));
    
    return true;
  } catch (error) {
    console.error('❌ Script failed:', error);
    return false;
  }
}

// Run the script
checkAndCreateBuckets().then(success => {
  if (success) {
    console.log('\n🎉 Storage buckets setup completed!');
  } else {
    console.log('\n❌ Failed to setup storage buckets');
  }
}); 