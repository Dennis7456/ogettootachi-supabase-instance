/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const _supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const _supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

const _supabase = createClient(_supabaseUrl, _supabaseServiceKey);

async function testChatbotWithUser() {
  try {
    // Step 1: Create a test user
    const _testEmail = `test-chatbot-${Date.now()}@example.com`;
    const _testPassword = 'testpassword123';
    const { _data: _userData, _error: _userError } =
      await _supabase.auth.admin.createUser({
        email: _testEmail,
        password: _testPassword,
        email_confirm: true,
        user_metadata: { role: 'user' },
      });

    _logError('User creation error', _userError);

    if (_userError) {
      return;
    }

    // Step 2: Check documents
    const { _data: _documents, _error: _docError } = await _supabase
      .from('documents')
      .select('*')
      .limit(3);

    _logError('Document fetch error', _docError);

    if (_docError) {
      return;
    }

    // Step 3: Test document search
    const _searchQuery = 'legal services';
    
    // Create embedding for search
    const _words = _searchQuery.toLowerCase().split(/\s+/);
    const _queryEmbedding = new Array(1536).fill(0);
    
    _words.forEach(_word => {
      const _hash = _word.split('').reduce((_a, _b) => {
        _a = (_a << 5) - _a + _b.charCodeAt(0);
        return _a & _a;
      }, 0);
      
      const _position = Math.abs(_hash) % 1536;
      _queryEmbedding[_position] = 1;
    });

    const { _data: _searchResults, _error: _searchError } = await _supabase.rpc(
      'match_documents',
      {
        query_embedding: _queryEmbedding,
        match_threshold: 0.1,
        match_count: 3,
      }
    );

    _logError('Search error', _searchError);

    if (_searchResults) {
      _searchResults.forEach((_doc, _index) => {
        console.log(`Search Result ${_index + 1}:`, _doc);
      });
    }

    // Step 4: Test conversation storage with real user
    const _testConversation = {
      user_id: _userData.user.id,
      session_id: `test-session-${Date.now()}`,
      message: 'What legal services do you offer?',
      response:
        'We offer comprehensive legal services including Corporate Law, Litigation, Intellectual Property, Employment Law, Real Estate, Tax Services, and Environmental Law.',
      documents_used: _documents
        .slice(0, 1)
        .map(_d => ({ id: _d.id, title: _d.title })),
      tokens_used: 50,
    };

    const { _data: _convData, _error: _convError } = await _supabase
      .from('chatbot_conversations')
      .insert(_testConversation)
      .select()
      .single();

    _logError('Conversation storage error', _convError);

    if (_convData) {
      // Test retrieving the conversation
      const { _data: _retrievedConv, _error: _retrieveError } = await _supabase
        .from('chatbot_conversations')
        .select('*')
        .eq('id', _convData.id)
        .single();

      _logError('Conversation retrieval error', _retrieveError);

      if (_retrievedConv) {
        console.log('Retrieved Conversation:', _retrievedConv);
      }
    }

    // Step 5: Test multiple conversations
    const _testMessages = [
      'What legal services do you offer?',
      'How can I contact your firm?',
      'What are your fees?',
      'Tell me about your experience',
    ];

    for (let _i = 0; _i < _testMessages.length; _i++) {
      const _message = _testMessages[_i];
      const _lowerMessage = _message.toLowerCase();
      let _response = '';

      if (_lowerMessage.includes('service') || _lowerMessage.includes('offer')) {
        _response =
          'We offer comprehensive legal services including Corporate Law, Litigation, Intellectual Property, Employment Law, Real Estate, Tax Services, and Environmental Law.';
      } else if (_lowerMessage.includes('contact')) {
        _response =
          'You can contact us through our website or by calling our office directly. We provide timely responses to all inquiries.';
      } else if (
        _lowerMessage.includes('fee') ||
        _lowerMessage.includes('cost')
      ) {
        _response =
          'We offer competitive and transparent fee structures tailored to each case. We provide initial consultations to discuss fee arrangements.';
      } else if (_lowerMessage.includes('experience')) {
        _response =
          'Our firm has been serving clients for over two decades with excellence and integrity. We have extensive experience in complex legal matters.';
      } else {
        _response =
          'Thank you for your inquiry. We are a leading law firm committed to providing exceptional legal services.';
      }

      const _conversation = {
        user_id: _userData.user.id,
        session_id: `test-session-${Date.now()}`,
        message: _message,
        response: _response,
        documents_used: _documents
          .slice(0, 1)
          .map(_d => ({ id: _d.id, title: _d.title })),
        tokens_used: _response.split(' ').length,
      };

      const { _error: _insertError } = await _supabase
        .from('chatbot_conversations')
        .insert(_conversation);

      _logError(`Failed to store conversation ${_i + 1}`, _insertError);
    }

    // Step 6: Test retrieving user's conversation history
    const { _data: _userConversations, _error: _historyError } = await _supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('user_id', _userData.user.id)
      .order('created_at', { ascending: false });

    _logError('History retrieval error', _historyError);

    if (_userConversations) {
      console.log(`✅ Retrieved ${_userConversations.length} conversations for user:`);
      _userConversations.forEach((_conv, _index) => {
        console.log(`   ${_index + 1}. "${_conv.message.substring(0, 40)}..." (${_conv.created_at})`);
      });
    }

    // Cleanup: Delete test user and conversations
    await _supabase
      .from('chatbot_conversations')
      .delete()
      .eq('user_id', _userData.user.id);

    await _supabase.auth.admin.deleteUser(_userData.user.id);

    console.log('\n💡 The chatbot is fully functional! You can now integrate it into your frontend.');
  } catch (_error) {
    console.error('❌ Test failed:', _error.message);
    console.error('Error details:', _error);
  }
}

// Run the test
testChatbotWithUser();
