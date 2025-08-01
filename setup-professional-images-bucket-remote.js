const { createClient } = require('@supabase/supabase-js');

// Remote Supabase configuration
const supabaseUrl = 'https://szbjuskqrfthmjehknly.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Ymp1c2txcmZ0aG1qZWhrbmx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQzNTg5OSwiZXhwIjoyMDY5MDExODk5fQ.cMrSpRsKWhU0OM9wpRtrhOFj-6HHzS-lVOJ91YCnepU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupProfessionalImagesBucket() {
  try {
    console.log('Setting up professional-images bucket and policies...');
    
    // Check if the bucket already exists
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('Error listing buckets:', bucketError);
      return;
    }

    const professionalBucket = buckets.find(bucket => bucket.id === 'professional-images');
    
    if (professionalBucket) {
      console.log('✅ Professional-images bucket already exists');
    } else {
      console.log('Creating professional-images bucket...');
      
      // Create the bucket
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('professional-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/gif']
      });
      
      if (createError) {
        console.error('Error creating bucket:', createError);
        return;
      }
      
      console.log('✅ Professional-images bucket created successfully');
    }

    // Set up RLS policies using SQL
    console.log('Setting up RLS policies...');
    
    const policies = [
      {
        name: 'Public can view professional images',
        definition: "(bucket_id = 'professional-images')",
        operation: 'SELECT'
      },
      {
        name: 'Users can upload their own professional images',
        definition: "(bucket_id = 'professional-images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)",
        operation: 'INSERT'
      },
      {
        name: 'Users can update their own professional images',
        definition: "(bucket_id = 'professional-images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)",
        operation: 'UPDATE'
      },
      {
        name: 'Users can delete their own professional images',
        definition: "(bucket_id = 'professional-images' AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = auth.uid()::text)",
        operation: 'DELETE'
      }
    ];

    for (const policy of policies) {
      try {
        // Drop existing policy if it exists
        await supabase.rpc('exec_sql', {
          sql: `DROP POLICY IF EXISTS "${policy.name}" ON storage.objects;`
        });
        
        // Create the policy
        const { error: policyError } = await supabase.rpc('exec_sql', {
          sql: `
            CREATE POLICY "${policy.name}" ON storage.objects
            FOR ${policy.operation} 
            ${policy.operation === 'INSERT' ? 'WITH CHECK' : 'USING'} (${policy.definition});
          `
        });
        
        if (policyError) {
          console.error(`Error creating policy "${policy.name}":`, policyError);
        } else {
          console.log(`✅ Policy "${policy.name}" created successfully`);
        }
      } catch (error) {
        console.error(`Error setting up policy "${policy.name}":`, error);
      }
    }

    // Enable RLS on storage.objects
    try {
      await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;'
      });
      console.log('✅ RLS enabled on storage.objects');
    } catch (error) {
      console.log('RLS already enabled or error:', error.message);
    }
    
    console.log('\n✅ Professional-images bucket and policies setup complete!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

setupProfessionalImagesBucket(); 