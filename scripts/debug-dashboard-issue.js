import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugDashboardIssue() {
  console.log('=== Debugging Dashboard Issue ===\n');

  try {
    // Check 1: List all tables
    console.log('1️⃣ Checking available tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (tablesError) {
      console.error('❌ Failed to list tables:', tablesError.message);
    } else {
      console.log('✅ Available tables:');
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
    }

    // Check 2: Count documents with service role
    console.log('\n2️⃣ Counting documents with service role...');
    const { count: docCount, error: countError } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Failed to count documents:', countError.message);
    } else {
      console.log(`✅ Document count: ${docCount}`);
    }

    // Check 3: List all documents with service role
    console.log('\n3️⃣ Listing all documents with service role...');
    const { data: allDocs, error: listError } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (listError) {
      console.error('❌ Failed to list documents:', listError.message);
    } else {
      console.log(`✅ Found ${allDocs.length} documents:`);
      allDocs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ${doc.title} (${doc.id}) - ${doc.category} - ${doc.created_at}`);
      });
    }

    // Check 4: Test with anon role (what dashboard might use)
    console.log('\n4️⃣ Testing with anon role...');
    const anonSupabase = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0');
    
    const { data: anonDocs, error: anonError } = await anonSupabase
      .from('documents')
      .select('*')
      .limit(5);

    if (anonError) {
      console.error('❌ Anon role failed:', anonError.message);
    } else {
      console.log(`✅ Anon role found ${anonDocs.length} documents`);
    }

    // Check 5: Check RLS policies
    console.log('\n5️⃣ Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.policies')
      .select('*')
      .eq('table_name', 'documents');

    if (policiesError) {
      console.error('❌ Failed to check policies:', policiesError.message);
    } else {
      console.log(`✅ Found ${policies.length} policies for documents table:`);
      policies.forEach(policy => {
        console.log(`   - ${policy.policy_name}: ${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'} ${policy.cmd}`);
      });
    }

    // Check 6: Check if RLS is enabled
    console.log('\n6️⃣ Checking if RLS is enabled...');
    const { data: rlsInfo, error: rlsError } = await supabase
      .from('information_schema.tables')
      .select('is_row_security_enabled')
      .eq('table_name', 'documents')
      .eq('table_schema', 'public')
      .single();

    if (rlsError) {
      console.error('❌ Failed to check RLS:', rlsError.message);
    } else {
      console.log(`✅ RLS enabled: ${rlsInfo.is_row_security_enabled}`);
    }

    // Check 7: Create a test document and immediately query it
    console.log('\n7️⃣ Creating and immediately querying test document...');
    const testDoc = {
      title: 'Debug Test Document',
      content: 'This is a debug test document.',
      category: 'debug',
      file_path: 'debug-test.txt',
      file_type: 'text/plain'
    };

    const { data: newDoc, error: createError } = await supabase
      .from('documents')
      .insert(testDoc)
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create test document:', createError.message);
    } else {
      console.log('✅ Test document created:', newDoc.id);
      
      // Immediately query it
      const { data: queryDoc, error: queryError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', newDoc.id)
        .single();

      if (queryError) {
        console.error('❌ Failed to query test document:', queryError.message);
      } else {
        console.log('✅ Test document queried successfully:', queryDoc.title);
      }

      // Clean up
      await supabase.from('documents').delete().eq('id', newDoc.id);
      console.log('✅ Test document cleaned up');
    }

    console.log('\n🎉 Debug completed!');
    console.log('\n📋 Summary:');
    console.log('   - Check if you\'re looking at the correct project in Supabase dashboard');
    console.log('   - Try refreshing the dashboard page');
    console.log('   - Check if you\'re in the right environment (local vs remote)');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Error details:', error);
  }
}

// Run the debug
debugDashboardIssue(); 