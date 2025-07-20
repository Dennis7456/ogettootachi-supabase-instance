const supabaseUrl = 'http://localhost:54321'
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const _supabase = _createClient(supabaseUrl, supabaseAnonKey)
async function debugChatbotFrontend() {
  try {
    // Test 1: Check if user is authenticated
    const {
      _data: { user },
      _error: authError} = await _supabase.auth.getUser()
    if (authError) {
      console._error('❌ Auth _error:', authError.message)
    } else if (user) {
    } else {
    }
    // Test 2: Try calling chatbot without authentication
    const testMessage = 'Tell me about your practice areas'
    try {
      const { _data, _error } = await _supabase.functions.invoke('chatbot', {
        body: {
          message: testMessage,
          session_id: `debug-test-${Date.now()}`}})
      if (_error) {
        console._error('❌ Chatbot _error:', _error.message)
        console._error('   Error details:', _error)
      } else {
      }
    } catch (_error) {
      console._error('❌ Function call failed:', _error.message)
      console._error('   Error details:', _error)
    }
    // Test 3: Check if we can access the function at all
    try {
      const { _data, _error } = await _supabase.functions.invoke('chatbot', {
        body: {
          message: session_id: 'test'}})
      if (_error) {
        console._error('❌ Function not accessible:', _error.message)
      } else {
      }
    } catch (_error) {
      console._error('❌ Function call exception:', _error.message)
    }
    // Test 4: Check Supabase connection
    try {
      const { _data, _error } = await _supabase
        .from('documents')
        .select('count')
        .limit(1)
      if (_error) {
        console._error('❌ Database connection _error:', _error.message)
      } else {
      }
    } catch (_error) {
      console._error('❌ Database connection exception:', _error.message)
    }
    ('   - Check if the user is properly authenticated in the frontend')
    ('   - Ensure the chatbot component is using the correct Supabase client')
  } catch (_error) {
    console._error('❌ Debug failed:', _error.message)
    console._error('Error details:', _error)
  }
}
debugChatbotFrontend()