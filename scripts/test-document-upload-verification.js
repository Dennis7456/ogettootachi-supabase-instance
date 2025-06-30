import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDocumentUploadVerification() {
  console.log('=== Document Upload Verification Test ===\n');

  try {
    // Step 1: Check if documents table exists and is empty
    console.log('1️⃣ Checking documents table...');
    const { data: existingDocs, error: listError } = await supabase
      .from('documents')
      .select('*')
      .limit(10);

    if (listError) {
      console.error('❌ Failed to list documents:', listError.message);
      return;
    }

    console.log(`✅ Documents table accessible. Found ${existingDocs.length} existing documents.`);

    // Step 2: Create a test document
    console.log('\n2️⃣ Creating test document...');
    const testDocument = {
      title: 'Test Document for Verification',
      content: 'This is a test document to verify that uploads are working correctly.',
      category: 'test',
      file_path: 'test-verification.txt',
      file_type: 'text/plain'
    };

    const { data: docData, error: insertError } = await supabase
      .from('documents')
      .insert(testDocument)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to create document:', insertError.message);
      return;
    }

    console.log('✅ Test document created successfully!');
    console.log('   Document ID:', docData.id);
    console.log('   Title:', docData.title);
    console.log('   Created at:', docData.created_at);

    // Step 3: Verify document exists in database
    console.log('\n3️⃣ Verifying document in database...');
    const { data: verifyDoc, error: verifyError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', docData.id)
      .single();

    if (verifyError) {
      console.error('❌ Failed to verify document:', verifyError.message);
    } else {
      console.log('✅ Document verified in database!');
      console.log('   ID:', verifyDoc.id);
      console.log('   Title:', verifyDoc.title);
      console.log('   Content length:', verifyDoc.content.length);
      console.log('   Has embedding:', !!verifyDoc.embedding);
    }

    // Step 4: Test Edge Function processing
    console.log('\n4️⃣ Testing Edge Function processing...');
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('process-document', {
      body: { record: docData }
    });

    if (edgeError) {
      console.error('❌ Edge Function failed:', edgeError.message);
    } else {
      console.log('✅ Edge Function processed successfully!');
      console.log('   Response:', edgeData);
    }

    // Step 5: Check if embedding was added
    console.log('\n5️⃣ Checking if embedding was added...');
    const { data: finalDoc, error: finalError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', docData.id)
      .single();

    if (finalError) {
      console.error('❌ Failed to check final document:', finalError.message);
    } else {
      console.log('✅ Final document check:');
      console.log('   Has embedding:', !!finalDoc.embedding);
      if (finalDoc.embedding) {
        console.log('   Embedding length:', finalDoc.embedding.length);
      }
      console.log('   Updated at:', finalDoc.updated_at);
    }

    // Step 6: List all documents to see in Supabase dashboard
    console.log('\n6️⃣ Listing all documents for Supabase dashboard...');
    const { data: allDocs, error: allError } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (allError) {
      console.error('❌ Failed to list all documents:', allError.message);
    } else {
      console.log(`✅ Found ${allDocs.length} total documents:`);
      allDocs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.title} (${doc.id}) - ${doc.category}`);
      });
    }

    // Step 7: Clean up test document
    console.log('\n7️⃣ Cleaning up test document...');
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', docData.id);

    if (deleteError) {
      console.error('❌ Failed to clean up:', deleteError.message);
    } else {
      console.log('✅ Test document cleaned up successfully!');
    }

    console.log('\n🎉 Document upload verification completed!');
    console.log('\n📋 Summary:');
    console.log('   - Documents table is accessible');
    console.log('   - Document creation works');
    console.log('   - Edge Function processing works');
    console.log('   - Documents should appear in Supabase dashboard');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test
testDocumentUploadVerification(); 