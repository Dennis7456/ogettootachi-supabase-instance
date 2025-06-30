import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEdgeFunctionDebug() {
  console.log('=== Edge Function Debug Test ===\n');

  try {
    // Create a test document
    console.log('1️⃣ Creating test document...');
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert({
        title: 'Debug Test Document',
        content: 'This is a test document for debugging the Edge Function.',
        category: 'test',
        file_path: 'test-debug.txt',
        file_type: 'text/plain'
      })
      .select()
      .single();

    if (docError) {
      console.error('❌ Document creation failed:', docError.message);
      return;
    }

    console.log('✅ Test document created:', docData.id);

    // Test 1: Standard format (what our tests use)
    console.log('\n2️⃣ Testing standard format: { record: {...} }');
    const { data: standardData, error: standardError } = await supabase.functions.invoke('process-document', {
      body: { record: docData }
    });

    if (standardError) {
      console.error('❌ Standard format failed:', standardError.message);
      console.error('Error details:', standardError);
    } else {
      console.log('✅ Standard format succeeded:', standardData);
    }

    // Test 2: Direct format (what debug component might use)
    console.log('\n3️⃣ Testing direct format: { id, content }');
    const { data: directData, error: directError } = await supabase.functions.invoke('process-document', {
      body: { 
        id: docData.id, 
        content: docData.content 
      }
    });

    if (directError) {
      console.error('❌ Direct format failed:', directError.message);
      console.error('Error details:', directError);
    } else {
      console.log('✅ Direct format succeeded:', directData);
    }

    // Test 3: Document format (alternative)
    console.log('\n4️⃣ Testing document format: { document: {...} }');
    const { data: documentData, error: documentError } = await supabase.functions.invoke('process-document', {
      body: { document: docData }
    });

    if (documentError) {
      console.error('❌ Document format failed:', documentError.message);
      console.error('Error details:', documentError);
    } else {
      console.log('✅ Document format succeeded:', documentData);
    }

    // Test 4: Empty body
    console.log('\n5️⃣ Testing empty body');
    const { data: emptyData, error: emptyError } = await supabase.functions.invoke('process-document', {
      body: {}
    });

    if (emptyError) {
      console.error('❌ Empty body failed:', emptyError.message);
      console.error('Error details:', emptyError);
    } else {
      console.log('✅ Empty body succeeded:', emptyData);
    }

    // Test 5: Invalid JSON
    console.log('\n6️⃣ Testing invalid JSON');
    try {
      const { data: invalidData, error: invalidError } = await supabase.functions.invoke('process-document', {
        body: "invalid json"
      });
      
      if (invalidError) {
        console.error('❌ Invalid JSON failed:', invalidError.message);
        console.error('Error details:', invalidError);
      } else {
        console.log('✅ Invalid JSON succeeded:', invalidData);
      }
    } catch (error) {
      console.error('❌ Invalid JSON threw exception:', error.message);
    }

    // Test 6: Missing fields
    console.log('\n7️⃣ Testing missing fields');
    const { data: missingData, error: missingError } = await supabase.functions.invoke('process-document', {
      body: { 
        id: docData.id,
        // missing content
      }
    });

    if (missingError) {
      console.error('❌ Missing fields failed:', missingError.message);
      console.error('Error details:', missingError);
    } else {
      console.log('✅ Missing fields succeeded:', missingData);
    }

    // Test 7: Simulate debug component call
    console.log('\n8️⃣ Testing debug component simulation');
    const debugComponentCall = {
      record: {
        id: docData.id,
        content: docData.content,
        title: docData.title,
        category: docData.category,
        file_path: docData.file_path,
        file_type: docData.file_type,
        created_at: docData.created_at,
        updated_at: docData.updated_at
      }
    };

    const { data: debugData, error: debugError } = await supabase.functions.invoke('process-document', {
      body: debugComponentCall
    });

    if (debugError) {
      console.error('❌ Debug component simulation failed:', debugError.message);
      console.error('Error details:', debugError);
    } else {
      console.log('✅ Debug component simulation succeeded:', debugData);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test document...');
    try {
      await supabase.from('documents').delete().eq('id', docData.id);
      console.log('✅ Test document cleaned up');
    } catch (cleanupError) {
      console.log('⚠️ Cleanup warning:', cleanupError.message);
    }

    console.log('\n🎉 Edge Function debug test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test
testEdgeFunctionDebug(); 