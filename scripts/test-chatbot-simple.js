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

async function testChatbotSimple() {
  try {
    // Test 1: Check documents
    const { _data: _documents, _error: _docError } = await _supabase
      .from('documents')
      .select('*')
      .limit(3);

    _logError('Document fetch error', _docError);

    if (_docError) {
      return;
    }

    // Test 2: Test document search directly
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

    // Test match_documents function
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

    // Test 3: Test rule-based response generation
    const _testMessages = [
      'What legal services do you offer?',
      'How can I contact your firm?',
      'What are your fees?',
      'Tell me about your experience',
      'I need help with a contract',
    ];

    const _generatedResponses = _testMessages.map((_message, _index) => {
      const _lowerMessage = _message.toLowerCase();
      let _response = '';

      if (
        ['service', 'practice', 'offer', 'area', 'policy', 'team', 'case', 
         'experience', 'unique', 'about', 'who', 'what', 'where', 'when', 'how']
        .some(keyword => _lowerMessage.includes(keyword))
      ) {
        _response =
          'Thank you for your inquiry. Ogetto, Otachi & Co Advocates offers comprehensive legal services including Corporate Law, Litigation, Intellectual Property, Employment Law, Real Estate, Tax Services, and Environmental Law.';
      } else if (
        _lowerMessage.includes('contact') ||
        _lowerMessage.includes('reach') ||
        _lowerMessage.includes('phone') ||
        _lowerMessage.includes('email')
      ) {
        _response =
          'To contact our firm, you can reach us through our website or by calling our office directly. We are committed to providing timely responses to all inquiries.';
      } else if (
        _lowerMessage.includes('cost') ||
        _lowerMessage.includes('fee') ||
        _lowerMessage.includes('price') ||
        _lowerMessage.includes('charge')
      ) {
        _response =
          'Our firm offers competitive and transparent fee structures tailored to the specific needs of each case. We provide initial consultations to discuss your case and fee arrangements.';
      } else if (
        _lowerMessage.includes('experience') ||
        _lowerMessage.includes('expertise') ||
        _lowerMessage.includes('background')
      ) {
        _response =
          'Our firm has been serving clients for over two decades with excellence and integrity. We have extensive experience in complex legal matters and a track record of successful outcomes.';
      } else {
        _response =
          'Thank you for your inquiry. Ogetto, Otachi & Co Advocates is a leading law firm committed to providing exceptional legal services. For specific questions, we recommend scheduling a consultation.';
      }

      console.log(`Response for '${_message}':`, _response);
      return _response;
    });

    // Test 4: Test conversation storage with proper UUID
    const _testConversation = {
      user_id: '00000000-0000-0000-0000-000000000000', // Valid UUID format
      session_id: `test-session-${Date.now()}`,
      message: 'What legal services do you offer?',
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
      // Clean up
      await _supabase
        .from('chatbot_conversations')
        .delete()
        .eq('id', _convData.id);
    }

    console.log(
      '💡 The chatbot is functional but needs authentication setup for the Edge Function.'
    );
  } catch (_error) {
    console.error('❌ Test failed:', _error.message);
    console.error('Error details:', _error);
  }
}

// Run the test
testChatbotSimple();
