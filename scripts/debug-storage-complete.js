import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugStorageComplete() {
  console.log('=== Complete Storage Debug ===\n');

  try {
    // 1. Check if documents bucket exists
    console.log('1. Checking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
    } else {
      console.log('✅ Available buckets:', buckets.map(b => b.name));
      const documentsBucket = buckets.find(b => b.name === 'documents');
      if (documentsBucket) {
        console.log('✅ Documents bucket found:', documentsBucket);
      } else {
        console.log('❌ Documents bucket not found');
      }
    }

    // 2. Sign in as admin user
    console.log('\n2. Signing in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123456'
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }

    console.log('✅ Admin authenticated:', authData.user.email);

    // 3. Get JWT and decode it
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const tokenParts = session.access_token.split('.');
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
      console.log('\n3. JWT Analysis:');
      console.log('Main role:', payload.role);
      console.log('User metadata role:', payload.user_metadata?.role);
      console.log('Full user_metadata:', payload.user_metadata);
    }

    // 4. Test storage upload with admin user
    console.log('\n4. Testing storage upload as admin...');
    const testFile = new File(['test content'], 'test-admin.txt', { type: 'text/plain' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload('test-admin.txt', testFile);

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      console.error('Error details:', uploadError);
    } else {
      console.log('✅ Upload succeeded:', uploadData);
      
      // Clean up
      await supabase.storage.from('documents').remove(['test-admin.txt']);
    }

    // 5. Test with service role (should always work)
    console.log('\n5. Testing storage upload with service role...');
    const serviceSupabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: serviceUploadData, error: serviceUploadError } = await serviceSupabase.storage
      .from('documents')
      .upload('test-service.txt', new File(['service test'], 'test-service.txt', { type: 'text/plain' }));

    if (serviceUploadError) {
      console.error('❌ Service role upload failed:', serviceUploadError.message);
    } else {
      console.log('✅ Service role upload succeeded:', serviceUploadData);
      
      // Clean up
      await serviceSupabase.storage.from('documents').remove(['test-service.txt']);
    }

    // 6. Check current storage policies
    console.log('\n6. Checking current storage policies...');
    console.log('Please run this SQL in Supabase SQL Editor to see current policies:');
    console.log(`
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';
    `);

    // 7. Test Edge Function
    console.log('\n7. Testing Edge Function...');
    try {
      const response = await fetch('http://127.0.0.1:54321/functions/v1/process-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          document_id: 'test-id',
          content: 'test content'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Edge Function responded:', result);
      } else {
        console.error('❌ Edge Function error:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error details:', errorText);
      }
    } catch (error) {
      console.error('❌ Edge Function connection failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

debugStorageComplete(); 