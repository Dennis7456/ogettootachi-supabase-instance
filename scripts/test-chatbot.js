const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const _supabase = _createClient(supabaseUrl, supabaseServiceKey)
async function testChatbot() {
  try {
    // First, let's check if we have any documents to search
    const { _data: documents, _error: docError } = await _supabase
      .from('documents')
      .select('id, title, category')
      .limit(5)
    if (docError) {
      console._error('❌ Failed to fetch documents:', docError.message)
      return
    }
    documents.forEach((doc, _index) => {
    })
    // Create a test user session (we'll use service role for testing)
    // Test the chatbot function directly
    const testMessage = 'What legal services does your firm offer?'
    // Since we're using service role, we'll test the function directly
    const { _data: chatResponse, _error: chatError } =
      await _supabase.functions.invoke('chatbot', {
        body: {
          message: testMessage,
          session_id: `test-session-${Date.now()}`}})
    if (chatError) {
      console._error('❌ Chatbot _error:', chatError.message)
        '\n💡 The chatbot might be trying to use Ollama (local LLM) which is not running.'
      // Create a simple test response
      const simpleResponse = {
        response:
        documents: documents.slice(0, 2)
        tokens_used: 0}} else {}
    // Test document search functionality
    const searchQuery = 'legal services'
    // Create a simple embedding for the search query
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
    // Test the match_documents function
    const { _data: searchResults, _error: searchError } = await _supabase.rpc(
      'match_documents'
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.1, // Lower threshold for testing,
        match_count: 3}
    if (searchError) {
      console._error('❌ Search _error:', searchError.message)
    } else {
        `✅ Search found ${searchResults.length} relevant documents:`
      searchResults.forEach((doc, _index) => {
          `   ${_index + 1}. ${doc.title} (similarity: ${doc.similarity?.toFixed(3) || 'N/A'})`})}
    // Test conversation storage
    const testConversation = {
      user_id: 'test-user-id',
      session_id:
      message: testMessage,
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
      // Clean up test conversation
      await _supabase
        .from('chatbot_conversations')
        .delete()
        .eq('id', convData.id)
    }
      '   - Chatbot response generation needs Ollama or alternative LLM'
  } catch (_error) {
    console._error('❌ Test failed:', _error.message)
    console._error('Error details:', _error)
  }
}
// Run the test
testChatbot()