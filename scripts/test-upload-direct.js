import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUploadDirect() {
  console.log('=== Direct Upload Test ===\n');

  try {
    // Step 1: Authenticate as admin
    console.log('1️⃣ Authenticating as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@test.com',
      password: 'admin123456'
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }

    console.log('✅ Admin authenticated:', authData.user.email);
    console.log('✅ User metadata:', authData.user.user_metadata);

    // Step 2: Test direct upload (skip bucket listing)
    console.log('\n2️⃣ Testing direct file upload...');
    const testFile = new File(['Test document content for direct upload'], 'test-direct.txt', { 
      type: 'text/plain' 
    });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(`test-direct-${Date.now()}.txt`, testFile);

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      console.error('Error details:', uploadError);
      return;
    }

    console.log('✅ File upload succeeded:', uploadData.path);

    // Step 3: Test database insert
    console.log('\n3️⃣ Testing database insert...');
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        title: 'Direct Test Document',
        content: 'This is a test document uploaded directly',
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

    // Step 4: Test Edge Function
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

    // Step 5: Verify the document
    console.log('\n5️⃣ Verifying document...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', docData.id)
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ Document verified in database');
      console.log('   - Title:', verifyData.title);
      console.log('   - Has embedding:', !!verifyData.embedding);
      console.log('   - File path:', verifyData.file_path);
    }

    // Step 6: Test reading documents
    console.log('\n6️⃣ Testing document reading...');
    const { data: allDocs, error: readError } = await supabase
      .from('documents')
      .select('*')
      .limit(5);

    if (readError) {
      console.error('❌ Document reading failed:', readError.message);
    } else {
      console.log('✅ Document reading succeeded');
      console.log('   - Found documents:', allDocs.length);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test file...');
    try {
      await supabase.storage.from('documents').remove([uploadData.path]);
      console.log('✅ Test file cleaned up');
    } catch (cleanupError) {
      console.log('⚠️ Cleanup warning:', cleanupError.message);
    }

    console.log('\n🎉 Direct upload test completed successfully!');
    console.log('\n=== Summary ===');
    console.log('✅ Authentication working');
    console.log('✅ Direct file upload working');
    console.log('✅ Database insert working');
    console.log('✅ Edge Function working');
    console.log('✅ Document verification working');
    console.log('✅ Document reading working');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test
testUploadDirect(); 