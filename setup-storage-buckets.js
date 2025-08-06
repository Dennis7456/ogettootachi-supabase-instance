import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorageBuckets() {
  try {
    console.log('Setting up storage buckets...');

    // Create blog-images bucket
    const { data: blogImagesBucket, error: blogImagesError } = await supabase
      .storage
      .createBucket('blog-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });

    if (blogImagesError) {
      console.log('blog-images bucket error:', blogImagesError.message);
    } else {
      console.log('✅ blog-images bucket created successfully');
    }

    // Create blog-documents bucket
    const { data: blogDocumentsBucket, error: blogDocumentsError } = await supabase
      .storage
      .createBucket('blog-documents', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ]
      });

    if (blogDocumentsError) {
      console.log('blog-documents bucket error:', blogDocumentsError.message);
    } else {
      console.log('✅ blog-documents bucket created successfully');
    }

    // List all buckets to verify
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
    } else {
      console.log('📦 Available buckets:', buckets.map(b => b.name));
    }

    console.log('🎉 Storage setup completed!');
  } catch (error) {
    console.error('❌ Error setting up storage:', error);
  }
}

setupStorageBuckets(); 