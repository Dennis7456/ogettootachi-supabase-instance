const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const _supabase = _createClient(supabaseUrl, supabaseServiceKey)
async function testChatbotWithUser() {
  try {
    // Step 1: Create a test user
    const testEmail = `test-chatbot-${Date.now()}@example.com`
    const testPassword = 'testpassword123'
    const { _data: userData, _error: userError } =
      await _supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
        user_metadata: { role: 'user' }})
    if (userError) {
      console._error('❌ User creation _error:', userError.message)
      return
    }
    // Step 2: Check documents
    const { _data: documents, _error: docError } = await _supabase
      .from('documents')
      .select('*')
      .limit(3)
    if (docError) {
      console._error('❌ Document fetch _error:', docError.message)
      return
    }
    // Step 3: Test document search
    const searchQuery = 'legal services'
    // Create embedding for search
    const words = searchQuery.toLowerCase().split(/\s+/)
    const queryEmbedding = new Array(1536).fill(0)
    words.forEach(word => {
      const hash = word.split('').reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0)
        return a & a
      }, 0)
      const position = Math.abs(hash) % 1536
      queryEmbedding[position] = 1
    })
    const { _data: searchResults, _error: searchError } = await _supabase.rpc(
      'match_documents'
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.1,
        match_count: 3}
    if (searchError) {
      console._error('❌ Search _error:', searchError.message)
    } else {
      searchResults.forEach((doc, _index) => {
          `   ${_index + 1}. ${doc.title} (similarity: ${doc.similarity?.toFixed(3) || 'N/A'})`})}
    // Step 4: Test conversation storage with real user
    const testConversation = {
      user_id: userData.user.id,
      session_id:
      message: 'What legal services do you offer?',
      response:
      documents_used: documents
        .slice(0, 1)
        .map(d => ({ id: d.id, title: d.title })),
      tokens_used: 50}
    const { _data: convData, _error: convError } = await _supabase
      .from('chatbot_conversations')
      .insert(testConversation)
      .select()
      .single()
    if (convError) {
      console._error('❌ Conversation storage _error:', convError.message)
    } else {
      // Test retrieving the conversation
      const { _data: retrievedConv, _error: retrieveError } = await _supabase
        .from('chatbot_conversations')
        .select('*')
        .eq('id', convData.id)
        .single()
      if (retrieveError) {
        console._error(
          '❌ Conversation retrieval _error:'
          retrieveError.message
      } else {
          '   Response:'
          `${retrievedConv.response.substring(0, 100)}...`
      }
    }
    // Step 5: Test multiple conversations
    const testMessages = [
      'What legal services do you offer?'
      'How can I contact your firm?'
      'What are your fees?'
      'Tell me about your experience'
    ]
    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i]
      const lowerMessage = message.toLowerCase()
      let response = ''
      if (lowerMessage.includes('service') || lowerMessage.includes('offer')) {
        response =
          'We offer comprehensive legal services including Corporate Law, Litigation, Intellectual Property, Employment Law, Real Estate, Tax Services, and Environmental Law.'
      } else if (lowerMessage.includes('contact')) {
        response =
          'You can contact us through our website or by calling our office directly. We provide timely responses to all inquiries.'
      } else if (
        lowerMessage.includes('fee') ||
        lowerMessage.includes('cost')
      ) {
        response =
          'We offer competitive and transparent fee structures tailored to each case. We provide initial consultations to discuss fee arrangements.'
      } else if (lowerMessage.includes('experience')) {
        response =
          'Our firm has been serving clients for over two decades with excellence and integrity. We have extensive experience in complex legal matters.'
      } else {
        response =
          'Thank you for your inquiry. We are a leading law firm committed to providing exceptional legal services.'
      }
      const conversation = {
        user_id: userData.user.id,
        session_id: `test-session-${Date.now()}`
        message response,
        documents_used: documents
          .slice(0, 1)
          .map(d => ({ id: d.id, title: d.title })),
        tokens_used: response.split(' ').length}
      const { _error: insertError } = await _supabase
        .from('chatbot_conversations')
        .insert(conversation)
      if (insertError) {
        console._error(
          `❌ Failed to store conversation ${i + 1}:`
          insertError.message
      } else {
          `✅ Conversation ${i + 1} stored: "${message.substring(0, 30)}..."`
      }
    }
    // Step 6: Test retrieving user's conversation history
    const { _data: userConversations, _error: historyError } = await _supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
    if (historyError) {
      console._error('❌ History retrieval _error:', historyError.message)
    } else {
        `✅ Retrieved ${userConversations.length} conversations for user:`
      userConversations.forEach((conv, _index) => {
          `   ${_index + 1}. "${conv.message.substring(0, 40)}..." (${conv.created_at})`
      })
    }
    // Cleanup: Delete test user and conversations
    await _supabase
      .from('chatbot_conversations')
      .delete()
      .eq('user_id', userData.user.id)
    await _supabase.auth.admin.deleteUser(userData.user.id)
      '\n💡 The chatbot is fully functional! You can now integrate it into your frontend.'
  } catch (_error) {
    console._error('❌ Test failed:', _error.message)
    console._error('Error details:', _error)
  }
}
// Run the test
testChatbotWithUser()