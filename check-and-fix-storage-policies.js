const { createClient } = require('@supabase/supabase-js');

// Remote Supabase configuration
const supabaseUrl = 'https://szbjuskqrfthmjehknly.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Ymp1c2txcmZ0aG1qZWhrbmx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQzNTg5OSwiZXhwIjoyMDY5MDExODk5fQ.cMrSpRsKWhU0OM9wpRtrhOFj-6HHzS-lVOJ91YCnepU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAndFixStoragePolicies() {
  try {
    console.log('🔍 Checking storage policies for professional-images bucket...');
    
    // Check if the bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('Error listing buckets:', bucketError);
      return;
    }

    const professionalBucket = buckets.find(bucket => bucket.id === 'professional-images');
    
    if (!professionalBucket) {
      console.error('❌ Professional-images bucket does not exist!');
      console.log('Please create the bucket first in your Supabase dashboard.');
      return;
    }

    console.log('✅ Professional-images bucket exists');

    // Check current policies
    console.log('\n📋 Current policies:');
    try {
      const { data: policies, error: policyError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'objects' 
          AND schemaname = 'storage'
          AND policyname LIKE '%professional%'
          ORDER BY policyname;
        `
      });
      
      if (policyError) {
        console.error('Error checking policies:', policyError);
      } else {
        console.log('Found policies:', policies);
      }
    } catch (error) {
      console.log('Could not check existing policies:', error.message);
    }

    // Drop existing policies and recreate them
    console.log('\n🔄 Recreating policies...');
    
    const policies = [
      {
        name: 'Public can view professional images',
        sql: `
          DROP POLICY IF EXISTS "Public can view professional images" ON storage.objects;
          CREATE POLICY "Public can view professional images" ON storage.objects
          FOR SELECT USING (bucket_id = 'professional-images');
        `
      },
      {
        name: 'Users can upload their own professional images',
        sql: `
          DROP POLICY IF EXISTS "Users can upload their own professional images" ON storage.objects;
          CREATE POLICY "Users can upload their own professional images" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'professional-images' 
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text
          );
        `
      },
      {
        name: 'Users can update their own professional images',
        sql: `
          DROP POLICY IF EXISTS "Users can update their own professional images" ON storage.objects;
          CREATE POLICY "Users can update their own professional images" ON storage.objects
          FOR UPDATE USING (
            bucket_id = 'professional-images' 
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text
          ) WITH CHECK (
            bucket_id = 'professional-images' 
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text
          );
        `
      },
      {
        name: 'Users can delete their own professional images',
        sql: `
          DROP POLICY IF EXISTS "Users can delete their own professional images" ON storage.objects;
          CREATE POLICY "Users can delete their own professional images" ON storage.objects
          FOR DELETE USING (
            bucket_id = 'professional-images' 
            AND auth.role() = 'authenticated'
            AND (storage.foldername(name))[1] = auth.uid()::text
          );
        `
      }
    ];

    for (const policy of policies) {
      try {
        console.log(`Creating policy: ${policy.name}`);
        const { error } = await supabase.rpc('exec_sql', {
          sql: policy.sql
        });
        
        if (error) {
          console.error(`❌ Error creating policy "${policy.name}":`, error);
        } else {
          console.log(`✅ Policy "${policy.name}" created successfully`);
        }
      } catch (error) {
        console.error(`❌ Error with policy "${policy.name}":`, error.message);
      }
    }

    // Enable RLS
    try {
      await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;'
      });
      console.log('✅ RLS enabled on storage.objects');
    } catch (error) {
      console.log('RLS already enabled or error:', error.message);
    }

    console.log('\n✅ Storage policies setup complete!');
    console.log('\n📝 Test the upload again in your application.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkAndFixStoragePolicies(); 