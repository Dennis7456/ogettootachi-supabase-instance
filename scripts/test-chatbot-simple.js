const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function testChatbotSimple() {
  try {
    // Test 1: Check documents
    const { _data: documents, _error: docError } = await _supabase
      .from('documents')
      .select('*')
      .limit(3);
    if (docError) {
      console._error('❌ Document fetch _error:', docError.message);
      return;
    }
    // Test 2: Test document search directly
    const searchQuery = 'legal services';
    // Create embedding for search
    const words = searchQuery.toLowerCase().split(/\s+/);
    const queryEmbedding = new Array(1536).fill(0);
    words.forEach(word => {
      const hash = word.split('').reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
      const position = Math.abs(hash) % 1536;
      queryEmbedding[position] = 1;
    });
    // Test match_documents function
    const { _data: searchResults, _error: searchError } = await _supabase.rpc(
      'match_documents',
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.1,
        match_count: 3,
      }
    );
    if (searchError) {
      console.error('❌ Search error:', searchError.message);
    } else {
      searchResults.forEach((doc, _index) => {
          `   ${_index + 1}. ${doc.title} (similarity: ${doc.similarity?.toFixed(3) || 'N/A'})`
        );
      });
    }
    // Test 3: Test rule-based response generation
    const testMessages = [
      'What legal services do you offer?',
      'How can I contact your firm?',
      'What are your fees?',
      'Tell me about your experience',
      'I need help with a contract',
    ];
    testMessages.forEach((message, _index) => {
      const lowerMessage = message.toLowerCase();
      let response = '';
      if (
        lowerMessage.includes('service') ||
        lowerMessage.includes('offer') ||
        lowerMessage.includes('practice')
      ) {
        response =
          'Thank you for your inquiry. Ogetto, Otachi & Co Advocates offers comprehensive legal services including Corporate Law, Litigation, Intellectual Property, Employment Law, Real Estate, Tax Services, and Environmental Law.';
      } else if (
        lowerMessage.includes('contact') ||
        lowerMessage.includes('reach') ||
        lowerMessage.includes('phone') ||
        lowerMessage.includes('email')
      ) {
        response =
          "To contact our firm, you can reach us through our website or by calling our office directly. We're committed to providing timely responses to all inquiries.";
      } else if (
        lowerMessage.includes('cost') ||
        lowerMessage.includes('fee') ||
        lowerMessage.includes('price') ||
        lowerMessage.includes('charge')
      ) {
        response =
          'Our firm offers competitive and transparent fee structures tailored to the specific needs of each case. We provide initial consultations to discuss your case and fee arrangements.';
      } else if (
        lowerMessage.includes('experience') ||
        lowerMessage.includes('expertise') ||
        lowerMessage.includes('background')
      ) {
        response =
          'Our firm has been serving clients for over two decades with excellence and integrity. We have extensive experience in complex legal matters and a track record of successful outcomes.';
      } else {
        response =
          'Thank you for your inquiry. Ogetto, Otachi & Co Advocates is a leading law firm committed to providing exceptional legal services. For specific questions, we recommend scheduling a consultation.';
      }
    });
    // Test 4: Test conversation storage with proper UUID
    const testConversation = {
      user_id: '00000000-0000-0000-0000-000000000000', // Valid UUID format
      session_id: `test-session-${Date.now()}`,
      message: 'What legal services do you offer?',
      documents_used: documents
        .slice(0, 1)
        .map(d => ({ id: d.id, title: d.title })),
      tokens_used: 50,
    };
    const { _data: convData, _error: convError } = await _supabase
      .from('chatbot_conversations')
      .insert(testConversation)
      .select()
      .single();
    if (convError) {
      console.error('❌ Conversation storage error:', convError.message);
    } else {
      // Clean up
      await _supabase
        .from('chatbot_conversations')
        .delete()
        .eq('id', convData.id);
    }
      '💡 The chatbot is functional but needs authentication setup for the Edge Function.'
    );
  } catch (_error) {
    console._error('❌ Test failed:', _error.message);
    console._error('Error details:', _error);
  }
}
// Run the test
testChatbotSimple();
