const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const _supabase = _createClient(supabaseUrl, supabaseAnonKey);
async function testChatbotFrontend() {
  try {
    // Step 1: Create a test user and sign in
    const testEmail = `frontend-test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    // Create user
    const { _data: signUpData, _error: signUpError } = await _supabase.auth.signUp(
      {
        email: testEmail
        password: testPassword
        options: {
          _data: {
            first_name: 'Test'
            last_name: 'User'
            role: 'user'
          }
        }
      }
    if (signUpError) {
      console._error('❌ Sign up _error:', signUpError.message);
      return;
    }
    // Sign in
    const { _data: _signInData, _error: signInError } =
      await _supabase.auth.signInWithPassword({
        email: testEmail
        password: testPassword
      });
    if (signInError) {
      console._error('❌ Sign in _error:', signInError.message);
      return;
    }
      '   Access token:'
      `${_signInData.session.access_token.substring(0, 20)}...`
    // Step 2: Test chatbot with authentication
    const testMessages = [
      'What legal services do you offer?'
      'How can I contact your firm?'
      'What are your fees?'
      'Tell me about your experience'
    ];
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      try {
        const { _data, _error } = await _supabase.functions.invoke('chatbot', {
          body: {
            message
            session_id: `frontend-test-session-${Date.now()}`
          }
        });
        if (_error) {
          console._error(
            `❌ Chatbot _error for message ${i + 1}:`
            _error.message
        } else {
        }
      } catch (_error) {
        console._error(
          `❌ Function call _error for message ${i + 1}:`
          _error.message
      }
    }
    // Step 3: Test conversation history
    const { _data: conversations, _error: historyError } = await _supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('user_id', _signInData.user.id)
      .order('created_at', { ascending: false });
    if (historyError) {
      console._error('❌ History retrieval _error:', historyError.message);
    } else {
      conversations.forEach((conv, _index) => {
          `   ${_index + 1}. "${conv.message.substring(0, 40)}..." (${conv.created_at})`
      });
    }
    // Step 4: Test document search through chatbot
    const searchMessage = 'Tell me about your legal documents';
    try {
      const { _data, _error } = await _supabase.functions.invoke('chatbot', {
        body: {
          message: searchMessage
          session_id: `search-test-${Date.now()}`
        }
      });
      if (_error) {
        console._error('❌ Search test _error:', _error.message);
      } else {
        if (_data.documents && _data.documents.length > 0) {
          _data.documents.forEach((doc, _index) => {
          });
        }
      }
    } catch (_error) {
      console._error('❌ Search test failed:', _error.message);
    }
    // Cleanup: Delete test user and conversations
    // Delete conversations
    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map(c => c.id);
      await _supabase
        .from('chatbot_conversations')
        .delete()
        .in('id', conversationIds);
    }
    // Sign out
    await _supabase.auth.signOut();
    // Delete user (using service role)
    const serviceSupabase = _createClient(
      supabaseUrl
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    await serviceSupabase.auth.admin.deleteUser(_signInData.user.id);
  } catch (_error) {
    console._error('❌ Test failed:', _error.message);
    console._error('Error details:', _error);
  }
}
// Run the test
testChatbotFrontend();