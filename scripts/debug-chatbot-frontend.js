/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';

const _supabaseUrl = 'http://localhost:54321';
const _supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

const _supabase = createClient(_supabaseUrl, _supabaseAnonKey);

async function debugChatbotFrontend() {
  try {
    // Test 1: Check if user is authenticated
    const {
      _data: { user },
      _error: _authError,
    } = await _supabase.auth.getUser();

    _logError('Auth error', _authError);

    if (user) {
      console.log('✅ User authenticated:', user.email);
    } else {
      console.log('❌ No user authenticated');
    }

    // Test 2: Try calling chatbot without authentication
    const _testMessage = 'Tell me about your practice areas';

    try {
      const { _data, _error } = await _supabase.functions.invoke('chatbot', {
        body: {
          message: _testMessage,
          session_id: `debug-test-${Date.now()}`,
        },
      });

      _logError('Chatbot error', _error);

      if (_data) {
        console.log('✅ Chatbot response received:', _data);
      }
    } catch (_error) {
      console.error('❌ Function call failed:', _error.message);
      console.error('   Error details:', _error);
    }

    // Test 3: Check if we can access the function at all
    try {
      const { _data, _error } = await _supabase.functions.invoke('chatbot', {
        body: {
          message: 'Test',
          session_id: 'test',
        },
      });

      _logError('Function not accessible', _error);

      if (_data) {
        console.log('✅ Chatbot function accessible');
      }
    } catch (_error) {
      console.error('❌ Function call exception:', _error.message);
    }

    // Test 4: Check Supabase connection
    try {
      const { _data, _error } = await _supabase
        .from('documents')
        .select('count')
        .limit(1);

      _logError('Database connection error', _error);

      if (_data) {
        console.log('✅ Database connection successful');
      }
    } catch (_error) {
      console.error('❌ Database connection exception:', _error.message);
    }

    console.log('Debug Recommendations:');
    console.log(
      '   - Check if the user is properly authenticated in the frontend'
    );
    console.log(
      '   - Ensure the chatbot component is using the correct Supabase client'
    );
  } catch (_error) {
    console.error('❌ Debug failed:', _error.message);
    console.error('Error details:', _error);
  }
}

debugChatbotFrontend();
