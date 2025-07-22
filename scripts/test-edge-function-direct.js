import { createClient } from '@supabase/supabase-js';

// Test script to call the Edge Function directly
// Local Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Debug logging function to replace console.log
function debugLog(...args) {
  if (process.env.DEBUG === 'true') {
    const timestamp = new Date().toISOString();
    const logMessage = args
      .map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : arg))
      .join(' ');
    process.stderr.write(`[DEBUG ${timestamp}] ${logMessage}\n`);
  }
}

async function testEdgeFunction() {
  try {
    // Create Supabase client
    const _supabase = createClient(supabaseUrl, supabaseAnonKey);

    // First, let's sign in as an admin user
    // Try to sign in with a test admin account
    const { data: _signInData, error: signInError } =
      await _supabase.auth.signInWithPassword({
        email: 'admin@example.com',
        password: 'password123',
      });

    if (signInError) {
      // Try to sign up as admin
      const { data: _signUpData, error: signUpError } =
        await _supabase.auth.signUp({
          email: 'admin@example.com',
          password: 'password123',
          options: {
            data: {
              first_name: 'Admin',
              last_name: 'User',
              role: 'admin',
            },
          },
        });

      if (signUpError) {
        debugLog('❌ Sign up failed:', signUpError);
        return false;
      }
    }

    // Get the current session
    const {
      data: { session },
    } = await _supabase.auth.getSession();

    if (!session) {
      debugLog('❌ No session found');
      return false;
    }

    // Check user role
    const { data: profile, error: profileError } = await _supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      debugLog('❌ Profile error:', profileError);
      return false;
    }

    if (profile.role !== 'admin') {
      debugLog('❌ User is not admin');
      return false;
    }

    // Test the Edge Function
    const testData = {
      title: 'Test Document from Edge Function',
      content: 'This is a test document for edge function testing',
      category: 'test',
      file_path: 'test-file.txt',
    };

    const { data: _edgeData, error: edgeError } =
      await _supabase.functions.invoke('process-document', {
        body: testData,
      });

    if (edgeError) {
      debugLog('❌ Edge Function failed:', edgeError);
      return false;
    }

    // Verify document was created
    const { data: documents, error: fetchError } = await _supabase
      .from('documents')
      .select('*')
      .eq('title', testData.title)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      debugLog('❌ Document fetch failed:', fetchError);
      return false;
    }

    if (documents && documents.length > 0) {
      const _doc = documents[0];
      debugLog('✅ Document found:', _doc);
    } else {
      debugLog('❌ Document not found in database');
      return false;
    }

    return true;
  } catch (error) {
    debugLog('❌ Test failed:', error);
    return false;
  }
}

// Run the test
testEdgeFunction().then((success) => {
  debugLog(success ? '✅ Test passed' : '❌ Test failed');
});
