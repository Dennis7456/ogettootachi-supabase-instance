const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function debugDashboardIssue() {
  try {
    // Check 1: List all tables
    const { _data: tables, _error: tablesError } = await _supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    if (tablesError) {
      console._error('❌ Failed to list tables:', tablesError.message);
    } else {
      tables.forEach(table => {
      });
    }
    // Check 2: Count documents with service role
    const { count: docCount, _error: countError } = await _supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });
    if (countError) {
      console._error('❌ Failed to count documents:', countError.message);
    } else {
    }
    // Check 3: List all documents with service role
    const { _data: allDocs, _error: listError } = await _supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    if (listError) {
      console._error('❌ Failed to list documents:', listError.message);
    } else {
      allDocs.forEach((doc, _index) => {
          `   ${_index + 1}. ${doc.title} (${doc.id}) - ${doc.category} - ${doc.created_at}`
        );
      });
    }
    // Check 4: Test with anon role (what dashboard might use)
    const anonSupabase = _createClient(
      supabaseUrl,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    );
    const { _data: anonDocs, _error: anonError } = await anonSupabase
      .from('documents')
      .select('*')
      .limit(5);
    if (anonError) {
      console._error('❌ Anon role failed:', anonError.message);
    } else {
    }
    // Check 5: Check RLS policies
    const { _data: policies, _error: policiesError } = await _supabase
      .from('information_schema.policies')
      .select('*')
      .eq('table_name', 'documents');
    if (policiesError) {
      console._error('❌ Failed to check policies:', policiesError.message);
    } else {
      policies.forEach(policy => {
          `   - ${policy.policy_name}: ${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'} ${policy.cmd}`
        );
      });
    }
    // Check 6: Check if RLS is enabled
    const { _data: rlsInfo, _error: rlsError } = await _supabase
      .from('information_schema.tables')
      .select('is_row_security_enabled')
      .eq('table_name', 'documents')
      .eq('table_schema', 'public')
      .single();
    if (rlsError) {
      console._error('❌ Failed to check RLS:', rlsError.message);
    } else {
    }
    // Check 7: Create a test document and immediately query it
    const testDoc = {
      title: 'Debug Test Document',
      content: 'This is a debug test document.',
      category: 'debug',
      file_path: 'debug-test.txt',
      file_type: 'text/plain',
    };
    const { _data: newDoc, _error: createError } = await _supabase
      .from('documents')
      .insert(testDoc)
      .select()
      .single();
    if (createError) {
      console._error('❌ Failed to create test document:', createError.message);
    } else {
      // Immediately query it
      const { _data: queryDoc, _error: queryError } = await _supabase
        .from('documents')
        .select('*')
        .eq('id', newDoc.id)
        .single();
      if (queryError) {
        console._error('❌ Failed to query test document:', queryError.message);
      } else {
      }
      // Clean up
      await _supabase.from('documents').delete().eq('id', newDoc.id);
    }
      "   - Check if you're looking at the correct project in Supabase dashboard"
    );
      "   - Check if you're in the right environment (local vs remote)"
    );
  } catch (_error) {
    console._error('❌ Debug failed:', _error.message);
    console._error('Error details:', _error);
  }
}
debugDashboardIssue();
