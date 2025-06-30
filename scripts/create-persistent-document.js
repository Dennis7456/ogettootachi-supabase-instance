import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPersistentDocument() {
  console.log('=== Creating Persistent Document for Dashboard ===\n');

  try {
    // Create a test document that will persist
    console.log('1️⃣ Creating persistent document...');
    const testDocument = {
      title: 'Dashboard Test Document',
      content: 'This document was created to verify it appears in the Supabase dashboard. It contains sample legal content for testing purposes.',
      category: 'legal',
      file_path: 'dashboard-test-document.txt',
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

    console.log('✅ Document created successfully!');
    console.log('   Document ID:', docData.id);
    console.log('   Title:', docData.title);
    console.log('   Category:', docData.category);
    console.log('   Created at:', docData.created_at);

    // Process with Edge Function
    console.log('\n2️⃣ Processing with Edge Function...');
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('process-document', {
      body: { record: docData }
    });

    if (edgeError) {
      console.error('❌ Edge Function failed:', edgeError.message);
    } else {
      console.log('✅ Edge Function processed successfully!');
      console.log('   Embedding length:', edgeData.embedding_length);
    }

    // Verify final state
    console.log('\n3️⃣ Verifying final document state...');
    const { data: finalDoc, error: finalError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', docData.id)
      .single();

    if (finalError) {
      console.error('❌ Failed to verify final document:', finalError.message);
    } else {
      console.log('✅ Final document state:');
      console.log('   ID:', finalDoc.id);
      console.log('   Title:', finalDoc.title);
      console.log('   Content length:', finalDoc.content.length);
      console.log('   Has embedding:', !!finalDoc.embedding);
      if (finalDoc.embedding) {
        console.log('   Embedding length:', finalDoc.embedding.length);
      }
      console.log('   Updated at:', finalDoc.updated_at);
    }

    console.log('\n🎉 Persistent document created successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Navigate to the "Table Editor"');
    console.log('   3. Select the "documents" table');
    console.log('   4. You should see the document: "Dashboard Test Document"');
    console.log('\n💡 If you don\'t see it, try refreshing the dashboard page.');

  } catch (error) {
    console.error('❌ Failed to create persistent document:', error.message);
    console.error('Error details:', error);
  }
}

// Run the script
createPersistentDocument(); 