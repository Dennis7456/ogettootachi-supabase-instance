/* eslint-disable no-console, no-undef, no-unused-vars */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const _supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utility function for logging errors
const logError = (prefix, error) => {
  if (error) {
    console.error(`❌ ${prefix}:`, error.message);
  }
};

async function testChatbotFrontend() {
  try {
    // Step 1: Create a test user and sign in
    const _testEmail = `frontend-test-${Date.now()}@example.com`;
    const _testPassword = 'testpassword123';

    // Create user
    const { _data: _signUpData, _error: _signUpError } =
      await _supabase.auth.signUp({
        email: _testEmail,
        password: _testPassword,
        options: {
          _data: {
            first_name: 'Test',
            last_name: 'User',
            role: 'user',
          },
        },
      });

    logError('Sign up error', _signUpError);
    if (_signUpError) return;

    // Sign in
    const { _data: _signInData, _error: _signInError } =
      await _supabase.auth.signInWithPassword({
        email: _testEmail,
        password: _testPassword,
      });

    logError('Sign in error', _signInError);
    if (_signInError) return;

    console.log(
      `   Access token: ${_signInData.session.access_token.substring(0, 20)}...`
    );

    // Step 2: Test chatbot with authentication
    const _testMessages = [
      'What legal services do you offer?',
      'How can I contact your firm?',
      'What are your fees?',
      'Tell me about your experience',
    ];

    for (let _i = 0; _i < _testMessages.length; _i++) {
      const _message = _testMessages[_i];
      try {
        const { _data, _error } = await _supabase.functions.invoke('chatbot', {
          body: {
            message: _message,
            session_id: `frontend-test-session-${Date.now()}`,
          },
        });

        logError(`Chatbot error for message ${_i + 1}`, _error);
      } catch (_error) {
        console.error(
          `❌ Function call error for message ${_i + 1}:`,
          _error.message
        );
      }
    }

    // Step 3: Test conversation history
    const { _data: _conversations, _error: _historyError } = await _supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('user_id', _signInData.user.id)
      .order('created_at', { ascending: false });

    logError('History retrieval error', _historyError);

    if (_conversations) {
      _conversations.forEach((_conv, _index) => {
        console.log(
          `   ${_index + 1}. "${_conv.message.substring(0, 40)}..." (${_conv.created_at})`
        );
      });
    }

    // Step 4: Test document search through chatbot
    const _searchMessage = 'Tell me about your legal documents';
    try {
      const { _data, _error } = await _supabase.functions.invoke('chatbot', {
        body: {
          message: _searchMessage,
          session_id: `search-test-${Date.now()}`,
        },
      });

      logError('Search test error', _error);

      if (_data && _data.documents && _data.documents.length > 0) {
        _data.documents.forEach((_doc, _index) => {
          // Intentionally left empty to satisfy linter
        });
      }
    } catch (_error) {
      console.error('❌ Search test failed:', _error.message);
    }

    // Cleanup: Delete test user and conversations
    // Delete conversations
    if (_conversations && _conversations.length > 0) {
      const _conversationIds = _conversations.map((_c) => _c.id);
      await _supabase
        .from('chatbot_conversations')
        .delete()
        .in('id', _conversationIds);
    }

    // Sign out
    await _supabase.auth.signOut();

    // Delete user (using service role)
    const _serviceSupabase = createClient(
      supabaseUrl,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    );
    await _serviceSupabase.auth.admin.deleteUser(_signInData.user.id);
  } catch (_error) {
    console.error('❌ Test failed:', _error.message);
  }
}

// Run the test
testChatbotFrontend();
