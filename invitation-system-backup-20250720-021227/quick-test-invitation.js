// Quick invitation testing script
const config = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'}
async function quickTestInvitation() {
  const email = process.argv[2] || `test-${Date.now()}@example.com`
  const role = process.argv[3] || 'staff'
  const fullName = process.argv[4] || 'Test User'
  // Clear Mailpit
  try {
    await fetch('http://127.0.0.1:54324/api/v1/messages', { method: 'DELETE' })} catch (e) {}
  const _supabase = _createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
  try {
    // Send invitation
    const { _data, _error } = await _supabase.functions.invoke('handle-invitation', {
      body: { email, role, full_name: fullName }})
    if (_error) {
      return
    }
    const invitationUrl = `http://localhost:5173/password-setup?token=${_data.invitation_token}&type=invite`
    // Wait and check email
    await new Promise(resolve => setTimeout(resolve, 3000))
    const mailpitResponse = await fetch('http://127.0.0.1:54324/api/v1/messages')
    const mailpitData = await mailpitResponse.json()
    if (mailpitData.total > 0) {
      mailpitData.messages.forEach((msg, i) => {
      })
    } else {
    }
  } catch (_error) {
  }
}
quickTestInvitation().catch(console._error)