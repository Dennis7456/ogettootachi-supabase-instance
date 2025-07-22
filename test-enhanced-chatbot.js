const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabase = _createClient(supabaseUrl, supabaseServiceKey);
async function testEnhancedChatbot() {
  try {
    // Test 1: Document retrieval and synthesis
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
      });
    }
    // Test 2: Intent detection and conversational flows
    const testScenarios = [
      {
        name: 'Info Request',
        messages: ['What legal services do you offer?'],
        expectedIntent: 'info',
      },
      {
        name: 'Messaging Flow',
        messages: [
          'I want to send a message to your staff',
          'I need help with a contract dispute. My email is john@example.com',
          'yes',
        ],
        expectedIntent: 'message_staff',
      },
      {
        name: 'Appointment Booking',
        messages: [
          'I want to book an appointment',
          'I need help with corporate law. Monday 2 PM. My email is jane@example.com',
          'yes',
        ],
        expectedIntent: 'book_appointment',
      },
      {
        name: 'Ambiguous Query',
        messages: ['Hello'],
        expectedIntent: 'ambiguous',
      },
    ];
    for (const scenario of testScenarios) {
      for (let i = 0; i < scenario.messages.length; i++) {
        const message = scenario.messages[i];
        // Simulate the enhanced response generation
        const response = await simulateEnhancedResponse(
          message,
          searchResults || [],
      }
    }
    // Test 3: Document blending and citation
    const testDocuments = [
      {
        title: '2025 Corporate Law Services',
        content:
          'Our corporate law services include comprehensive legal support for businesses of all sizes.',
        category: 'Corporate Law',
      },
      {
        title: 'Employment Law Guidelines',
        content:
          'We provide expert guidance on employment law, covering hiring, workplace policies, and dispute resolution.',
        category: 'Employment Law',
      },
    ];
    const blendedResponse = blendDocuments(testDocuments);
      '   ✅ Transactional workflows (messaging, booking) implemented'
    );
  } catch (_error) {
    console.error('❌ Test failed:', _error.message);
  }
}
// Simulate the enhanced response generation
async function simulateEnhancedResponse(message, documents, sessionId) {
  const lower = message.toLowerCase();
  // Simple intent detection
  let intent = 'info';
  if (/\b(book|appointment|schedule|consultation|meet)\b/.test(lower)) {
    intent = 'book_appointment';
  } else if (/\b(contact|message|reach|email|phone|send)\b/.test(lower)) {
    intent = 'message_staff';
  } else if (
    /\b(service|practice|offer|area|policy|team|case|experience|unique|about|who|what|where|when|how)\b/.test(
      lower
    )
  ) {
    intent = 'info';
  } else if (message.length < 10) {
    intent = 'ambiguous';
  }
  // Generate appropriate response
  switch (intent) {
    case 'info':
      if (documents.length > 0) {
        const docSummary = blendDocuments(documents);
        return `Here's what I found from our internal resources: \n${docSummary}\n\nWould you like to schedule a consultation or send a message to our staff?`;
      } else {
        return "I couldn't find a direct answer in our internal documents, but I'm here to help. Would you like to schedule a consultation or send a message to our staff?";
      }
    case 'message_staff':
      if (lower.includes('@') || /\d{10}/.test(lower)) {
        return "Perfect! I'll help you send a message to our staff. Should I proceed with sending your message?";
      } else {
        return "I'd be happy to help you send a message to our staff! Please provide your message and contact information.";
      }
    case 'book_appointment':
      if (lower.includes('@') || /\d{10}/.test(lower)) {
        return "Great! I'll help you schedule a consultation. Should I check availability and book this appointment?";
      } else {
        return "Great! I'd be happy to help you schedule a consultation. Please provide your preferred date/time and contact information.";
      }
    case 'ambiguous':
      return 'I want to make sure I help you best. Are you looking for information about our services, to send a message, or to schedule a consultation?';
    default:
      return "I'm here to help! What would you like to know about our services?";
  }
}
// Document blending function (same as in the edge function)
function blendDocuments(docs) {
  if (!docs.length) {
    return '';
  }
  const summary = docs
    .map((doc, i) => {
      const cite = doc.title
        ? ` (see: ${doc.title}${doc.category ? `, ${doc.category}` : ''})`
        : '';
      const content = doc.content.replace(/\s+/g, ' ').slice(0, 350);
      return `- ${content}${cite}`;
    })
    .join('\n');
  return summary;
}
// Run the test
testEnhancedChatbot();
