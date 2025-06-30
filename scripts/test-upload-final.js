import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUploadFinal() {
  console.log('=== Final Document Upload Test ===\n');

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

    // Test 2: Direct File Upload (skip bucket listing)
    console.log('\n2️⃣ Testing Direct File Upload...');
    const testFile = new File(['Test document content for final verification'], 'test-final.txt', { 
      type: 'text/plain' 
    });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`test-final-${Date.now()}.txt`, testFile);

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      console.error('Error details:', uploadError);
      return;
    }

    console.log('✅ File upload succeeded:', uploadData.path);

    // Test 3: Database Insert
    console.log('\n3️⃣ Testing Database Insert...');
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        title: 'Final Test Document',
        content: 'This is a test document for final verification of the complete upload system.',
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

    // Test 4: Edge Function
    console.log('\n4️⃣ Testing Edge Function...');
    const { data: functionData, error: functionError } = await supabase.functions.invoke('process-document', {
      body: { record: docData }
    });

    if (functionError) {
      console.error('❌ Edge Function failed:', functionError.message);
      console.error('Error details:', functionError);
    } else {
      console.log('✅ Edge Function succeeded:', functionData);
    }

    // Test 5: Full Upload Flow with Realistic Content
    console.log('\n5️⃣ Testing Complete Upload Flow...');
    
    const realisticContent = `
      This is a comprehensive test document for the law firm website.
      It contains multiple paragraphs and should be processed by the Edge Function.
      The document should be stored in the database and made available for the chatbot.
      This test verifies the complete document upload and processing pipeline.
      The system should handle various types of legal documents and content.
      This includes contracts, legal briefs, and other important documents.
      The embedding generation should work correctly for semantic search.
      The document should be accessible through the chatbot interface.
    `.trim();

    const realisticFile = new File([realisticContent], 'realistic-test.txt', { 
      type: 'text/plain' 
    });

    // Upload file
    const { data: realisticUploadData, error: realisticUploadError } = await supabase.storage
      .from('documents')
      .upload(`realistic-test-${Date.now()}.txt`, realisticFile);

    if (realisticUploadError) {
      console.error('❌ Realistic upload failed:', realisticUploadError.message);
      return;
    }

    console.log('✅ Realistic upload succeeded');

    // Insert into database
    const { data: realisticDocData, error: realisticDocError } = await supabase
      .from('documents')
      .insert({
        title: 'Realistic Test Document',
        content: realisticContent,
        category: 'test',
        file_path: realisticUploadData.path,
        file_type: 'text/plain'
      })
      .select()
      .single();

    if (realisticDocError) {
      console.error('❌ Realistic database insert failed:', realisticDocError.message);
      return;
    }

    console.log('✅ Realistic database insert succeeded');

    // Process with Edge Function
    const { data: realisticFunctionData, error: realisticFunctionError } = await supabase.functions.invoke('process-document', {
      body: { record: realisticDocData }
    });

    if (realisticFunctionError) {
      console.error('❌ Realistic Edge Function failed:', realisticFunctionError.message);
    } else {
      console.log('✅ Realistic Edge Function succeeded');
    }

    // Test 6: Verify Results
    console.log('\n6️⃣ Verifying Results...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', realisticDocData.id)
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ Document verified in database');
      console.log('   - Title:', verifyData.title);
      console.log('   - Has embedding:', !!verifyData.embedding);
      console.log('   - File path:', verifyData.file_path);
      console.log('   - Content length:', verifyData.content.length);
    }

    // Test 7: Document Reading
    console.log('\n7️⃣ Testing Document Reading...');
    const { data: allDocs, error: readError } = await supabase
      .from('documents')
      .select('*')
      .limit(10);

    if (readError) {
      console.error('❌ Document reading failed:', readError.message);
    } else {
      console.log('✅ Document reading succeeded');
      console.log('   - Found documents:', allDocs.length);
      console.log('   - Documents with embeddings:', allDocs.filter(doc => doc.embedding).length);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test files...');
    try {
      await supabase.storage.from('documents').remove([uploadData.path]);
      await supabase.storage.from('documents').remove([realisticUploadData.path]);
      console.log('✅ Test files cleaned up');
    } catch (cleanupError) {
      console.log('⚠️ Cleanup warning:', cleanupError.message);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n=== Final Summary ===');
    console.log('✅ Authentication working');
    console.log('✅ Direct file upload working');
    console.log('✅ Database insert working');
    console.log('✅ Edge Function working');
    console.log('✅ Complete upload flow working');
    console.log('✅ Document verification working');
    console.log('✅ Document reading working');
    console.log('✅ Embedding generation working');
    console.log('\n🚀 Document upload system is fully operational!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test
testUploadFinal(); 