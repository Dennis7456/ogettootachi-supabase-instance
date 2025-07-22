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

async function testChatbot() {
  try {
    // First, let's check if we have any documents to search
    const { _data: _documents, _error: _docError } = await _supabase
      .from('documents')
      .select('id, title, category')
      .limit(5);

    _logError('Failed to fetch documents', _docError);

    if (_docError) {
      return;
    }

    _documents.forEach((_doc, _index) => {
      console.log(`Document ${_index + 1}:`, _doc);
    });

    // Create a test user session (we'll use service role for testing)
    // Test the chatbot function directly
    const _testMessage = 'What legal services does your firm offer?';

    // Since we're using service role, we'll test the function directly
    const { _data: _chatResponse, _error: _chatError } =
      await _supabase.functions.invoke('chatbot', {
        body: {
          message: _testMessage,
          session_id: `test-session-${Date.now()}`,
        },
      });

    _logError('Chatbot error', _chatError);

    let _simpleResponse;
    if (_chatError) {
      console.log(
        '\n💡 The chatbot might be trying to use Ollama (local LLM) which is not running.'
      );

      // Create a simple test response
      _simpleResponse = {
        response: 'A simple response about legal services',
        documents: _documents.slice(0, 2),
        tokens_used: 0,
      };

      console.log('Simple Response:', _simpleResponse);
    } else {
      console.log('Chatbot Response:', _chatResponse);
    }

    // Test document search functionality
    const _searchQuery = 'legal services';

    // Create a simple embedding for the search query
    const _words = _searchQuery.toLowerCase().split(/\s+/);
    const _queryEmbedding = new Array(1536).fill(0);

    _words.forEach((_word) => {
      const _hash = _word.split('').reduce((_a, _b) => {
        _a = (_a << 5) - _a + _b.charCodeAt(0);
        return _a & _a;
      }, 0);

      const _position = Math.abs(_hash) % 1536;
      _queryEmbedding[_position] = 1;
    });

    // Test the match_documents function
    const { _data: _searchResults, _error: _searchError } = await _supabase.rpc(
      'match_documents',
      {
        query_embedding: _queryEmbedding,
        match_threshold: 0.1, // Lower threshold for testing
        match_count: 3,
      }
    );

    _logError('Search error', _searchError);

    if (_searchResults) {
      _searchResults.forEach((_doc, _index) => {
        console.log(`Search Result ${_index + 1}:`, _doc);
      });
    }

    // Test conversation storage
    const _testConversation = {
      user_id: 'test-user-id',
      session_id: `test-session-${Date.now()}`,
      message: _testMessage,
      response:
        'We offer comprehensive legal services including Corporate Law, Litigation, Intellectual Property, Employment Law, Real Estate, Tax Services, and Environmental Law.',
      documents_used: _documents
        .slice(0, 1)
        .map((_d) => ({ id: _d.id, title: _d.title })),
      tokens_used: 50,
    };

    const { _data: _convData, _error: _convError } = await _supabase
      .from('chatbot_conversations')
      .insert(_testConversation)
      .select()
      .single();

    _logError('Conversation storage error', _convError);

    if (_convData) {
      // Clean up test conversation
      await _supabase
        .from('chatbot_conversations')
        .delete()
        .eq('id', _convData.id);
    }

    console.log(
      '   - Chatbot response generation needs Ollama or alternative LLM'
    );
  } catch (_error) {
    console.error('❌ Test failed:', _error.message);
    console.error('Error details:', _error);
  }
}

// Run the test
testChatbot();
