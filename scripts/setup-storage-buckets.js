import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageBuckets() {
  console.log('=== Setting Up Storage Buckets ===\n');

  try {
    // List existing buckets
    console.log('1. Checking existing buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return;
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
        console.error('❌ Failed to create documents bucket:', createError.message);
        return;
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
        console.error('❌ Failed to create public bucket:', createPublicError.message);
        return;
      }
      
      console.log('✅ Public bucket created:', newPublicBucket);
    } else {
      console.log('✅ Public bucket already exists');
    }

    // Check if blog-images bucket exists
    const blogImagesBucket = buckets.find(bucket => bucket.name === 'blog-images');
    
    if (!blogImagesBucket) {
      console.log('4. Creating blog-images bucket...');
      
      const { data: newBlogBucket, error: createBlogError } = await supabase.storage.createBucket('blog-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (createBlogError) {
        console.error('❌ Failed to create blog-images bucket:', createBlogError.message);
        return;
      }
      
      console.log('✅ Blog-images bucket created:', newBlogBucket);
    } else {
      console.log('✅ Blog-images bucket already exists');
    }

    // Verify all buckets exist
    console.log('\n5. Verifying all buckets...');
    const { data: finalBuckets, error: finalError } = await supabase.storage.listBuckets();
    
    if (finalError) {
      console.error('❌ Error listing final buckets:', finalError.message);
      return;
    }
    
    console.log('✅ All buckets:', finalBuckets.map(b => b.name));
    
    const requiredBuckets = ['documents', 'public', 'blog-images'];
    const missingBuckets = requiredBuckets.filter(name => !finalBuckets.find(b => b.name === name));
    
    if (missingBuckets.length > 0) {
      console.error('❌ Missing buckets:', missingBuckets);
    } else {
      console.log('✅ All required buckets are present');
    }

    console.log('\n=== Storage Bucket Setup Complete ===');
    console.log('You can now run the document upload test script.');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the setup
setupStorageBuckets(); 