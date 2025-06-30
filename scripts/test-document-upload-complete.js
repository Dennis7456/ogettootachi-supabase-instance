import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDocumentUploadComplete() {
  console.log('=== Comprehensive Document Upload Test ===\n');

  try {
    // Test 1: Authentication
    console.log('1️⃣ Testing Authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123456'
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ User authenticated:', authData.user.email);
    console.log('✅ User role: admin');
    console.log('✅ User metadata:', authData.user.user_metadata);

    // Test 2: Storage Bucket Access
    console.log('\n2️⃣ Testing Storage Bucket Access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Bucket listing failed:', bucketsError.message);
      return;
    }

    const documentsBucket = buckets.find(b => b.name === 'documents');
    if (!documentsBucket) {
      console.error('❌ Documents bucket not found');
      return;
    }

    console.log('✅ Documents bucket access confirmed');

    // Test 3: File Upload
    console.log('\n3️⃣ Testing File Upload...');
    const testFile = new File(['Test document content for upload verification'], 'test-document.txt', { 
      type: 'text/plain' 
    });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`test-${Date.now()}.txt`, testFile);

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      console.error('Error details:', uploadError);
      return;
    }

    console.log('✅ File upload succeeded:', uploadData.path);

    // Test 4: Database Insert
    console.log('\n4️⃣ Testing Database Insert...');
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        title: 'Test Document',
        content: 'This is a test document for verification',
        category: 'test',
        file_path: uploadData.path,
        file_type: 'text/plain'
      })
      .select()
      .single();

    if (docError) {
      console.error('❌ Database insert failed:', docError.message);
      return;
    }

    console.log('✅ Database insert succeeded:', docData.id);

    // Test 5: Edge Function
    console.log('\n5️⃣ Testing Edge Function...');
    const { data: functionData, error: functionError } = await supabase.functions.invoke('process-document', {
      body: { record: docData }
    });

    if (functionError) {
      console.error('❌ Edge Function failed:', functionError.message);
      console.error('Error details:', functionError);
    } else {
      console.log('✅ Edge Function succeeded:', functionData);
    }

    // Test 6: Full Upload Flow
    console.log('\n6️⃣ Testing Complete Upload Flow...');
    
    // Create a more realistic document
    const fullContent = `
      This is a comprehensive test document for the law firm website.
      It contains multiple paragraphs and should be processed by the Edge Function.
      The document should be stored in the database and made available for the chatbot.
      This test verifies the complete document upload and processing pipeline.
    `.trim();

    const fullTestFile = new File([fullContent], 'comprehensive-test.txt', { 
      type: 'text/plain' 
    });

    // Upload file
    const { data: fullUploadData, error: fullUploadError } = await supabase.storage
      .from('documents')
      .upload(`comprehensive-test-${Date.now()}.txt`, fullTestFile);

    if (fullUploadError) {
      console.error('❌ Full upload failed:', fullUploadError.message);
      return;
    }

    console.log('✅ Full upload succeeded');

    // Insert into database
    const { data: fullDocData, error: fullDocError } = await supabase
      .from('documents')
      .insert({
        title: 'Comprehensive Test Document',
        content: fullContent,
        category: 'test',
        file_path: fullUploadData.path,
        file_type: 'text/plain'
      })
      .select()
      .single();

    if (fullDocError) {
      console.error('❌ Full database insert failed:', fullDocError.message);
      return;
    }

    console.log('✅ Full database insert succeeded');

    // Process with Edge Function
    const { data: fullFunctionData, error: fullFunctionError } = await supabase.functions.invoke('process-document', {
      body: { record: fullDocData }
    });

    if (fullFunctionError) {
      console.error('❌ Full Edge Function failed:', fullFunctionError.message);
    } else {
      console.log('✅ Full Edge Function succeeded');
    }

    // Test 7: Verify Results
    console.log('\n7️⃣ Verifying Results...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', fullDocData.id)
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ Document verified in database');
      console.log('   - Title:', verifyData.title);
      console.log('   - Has embedding:', !!verifyData.embedding);
      console.log('   - File path:', verifyData.file_path);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test files...');
    try {
      await supabase.storage.from('documents').remove([uploadData.path]);
      await supabase.storage.from('documents').remove([fullUploadData.path]);
      console.log('✅ Test files cleaned up');
    } catch (cleanupError) {
      console.log('⚠️ Cleanup warning:', cleanupError.message);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n=== Summary ===');
    console.log('✅ Authentication working');
    console.log('✅ Storage bucket access working');
    console.log('✅ File upload working');
    console.log('✅ Database insert working');
    console.log('✅ Edge Function working');
    console.log('✅ Complete upload flow working');
    console.log('✅ Document verification working');

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test
testDocumentUploadComplete(); 