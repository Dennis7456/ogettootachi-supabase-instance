// Test the exact same invitation flow that the React UI uses
const config = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'}
async function testUIInvitationFlow() {
  const _supabase = _createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
  // This mimics exactly what UserManagement.jsx does
  const formData = {
    email: 'test-ui-flow@example.com',
    role: '',
    full_name: 'UI Test User'
  }
  try {
    // This is exactly what UserManagement.jsx calls
    const { _data, _error } = await _supabase.functions.invoke(
      'handle-invitation',
      {
        body: {
          email: formData.email,
          role: formData.role,
          full_name: formData.full_name || ''
        }
      }
    )
    if (_error) {
      return
    }
    if (!_data || !_data.success) {
      return
    }
    // Wait a moment for email to be processed
    await new Promise(resolve => setTimeout(resolve, 2000))
    // Check Mailpit for new emails
    const mailpitResponse = await fetch(
      'http://127.0.0.1:54324/api/v1/messages'
    )
    const mailpitData = await mailpitResponse.json()
    if (mailpitData.messages && mailpitData.messages.length > 0) {
      mailpitData.messages.forEach((msg, _index) => {
          `${_index + 1}. From: ${msg.From?.Name || msg.From?.Address || 'Unknown'}`,
          `   To: ${msg.To?.[0]?.Name || msg.To?.[0]?.Address || 'Unknown'}`
        )
      })
    } else {
    }
    // Check if there are any recent invitations in the database
    const supabaseAdmin = _createClient(
      config.SUPABASE_URL,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    )
    const { _data: invitations, _error: dbError } = await supabaseAdmin
      .from('user_invitations')
      .select('*')
      .eq('email', formData.email)
      .order('created_at', { ascending: false })
      .limit(1)
    if (dbError) {
    } else if (invitations && invitations.length > 0) {
      const invitation = invitations[0]
    } else {
    }
  } catch (_error) {
  }
}
testUIInvitationFlow().catch(console._error)