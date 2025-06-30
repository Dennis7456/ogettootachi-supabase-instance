import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEdgeFunction() {
  console.log('=== Edge Function Debug Test ===\n');

  try {
    // Step 1: Create a test document in the database
    console.log('1️⃣ Creating test document...');
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        title: 'Edge Function Test Document',
        content: 'This is a test document for Edge Function debugging. It contains some sample text to process.',
        category: 'test',
        file_path: 'test-edge-function.txt',
        file_type: 'text/plain'
      })
      .select()
      .single();

    if (docError) {
      console.error('❌ Document creation failed:', docError.message);
      return;
    }

    console.log('✅ Test document created:', docData.id);
    console.log('   - Title:', docData.title);
    console.log('   - Content length:', docData.content.length);
    console.log('   - Has embedding:', !!docData.embedding);

    // Step 2: Test Edge Function with the document
    console.log('\n2️⃣ Testing Edge Function...');
    const { data: functionData, error: functionError } = await supabase.functions.invoke('process-document', {
      body: { record: docData }
    });

    if (functionError) {
      console.error('❌ Edge Function failed:', functionError.message);
      console.error('Error details:', functionError);
      
      // Check if it's a deployment issue
      if (functionError.message.includes('not found') || functionError.message.includes('404')) {
        console.log('\n🔧 This might be a deployment issue. Try:');
        console.log('   supabase functions deploy process-document');
      }
      
      return;
    }

    console.log('✅ Edge Function succeeded:', functionData);

    // Step 3: Verify the document was updated
    console.log('\n3️⃣ Verifying document update...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', docData.id)
      .single();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    } else {
      console.log('✅ Document verified:');
      console.log('   - Has embedding:', !!verifyData.embedding);
      console.log('   - Embedding length:', verifyData.embedding?.length || 0);
    }

    // Step 4: Test with different content
    console.log('\n4️⃣ Testing with longer content...');
    const longContent = `
      This is a longer test document for Edge Function debugging. 
      It contains multiple paragraphs and should test the content length limits.
      The Edge Function should process this content and generate embeddings.
      This document is specifically designed to test the document processing pipeline.
      It includes various types of text content to ensure proper processing.
    `.trim();

    const { data: longDocData, error: longDocError } = await supabase
      .from('documents')
      .insert({
        title: 'Long Test Document',
        content: longContent,
        category: 'test',
        file_path: 'test-long-document.txt',
        file_type: 'text/plain'
      })
      .select()
      .single();

    if (longDocError) {
      console.error('❌ Long document creation failed:', longDocError.message);
    } else {
      console.log('✅ Long document created:', longDocData.id);
      
      const { data: longFunctionData, error: longFunctionError } = await supabase.functions.invoke('process-document', {
        body: { record: longDocData }
      });

      if (longFunctionError) {
        console.error('❌ Long document Edge Function failed:', longFunctionError.message);
      } else {
        console.log('✅ Long document Edge Function succeeded:', longFunctionData);
      }
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test documents...');
    try {
      await supabase.from('documents').delete().eq('id', docData.id);
      if (longDocData) {
        await supabase.from('documents').delete().eq('id', longDocData.id);
      }
      console.log('✅ Test documents cleaned up');
    } catch (cleanupError) {
      console.log('⚠️ Cleanup warning:', cleanupError.message);
    }

    console.log('\n🎉 Edge Function test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test
testEdgeFunction(); 