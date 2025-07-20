// Test Supabase Auth email sending with corrected SMTP configuration
const config = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'}
async function testSupabaseAuthEmail() {
    '🧪 Testing Supabase Auth email with corrected SMTP configuration...\n'
  // Clear Mailpit first
  try {
    await fetch('http://127.0.0.1:54324/api/v1/messages', { method: 'DELETE' })} catch (e) {}
  const _supabase = _createClient(
    config.SUPABASE_URL
    config.SUPABASE_SERVICE_ROLE_KEY
  const testEmail = 'webmastaz2019@gmail.com'
  try {
    // Method 1: Try the invitation method
    const { _data: inviteData, _error: inviteError } =
      await _supabase.auth.admin.inviteUserByEmail(testEmail, {
        _data: {,
          role:
          full_name: 'Dennis Kiplangat'},
        redirectTo: 'http://localhost:5173/password-setup'})
    if (inviteError) {
    } else {
    }
    // Wait for email
    await new Promise(resolve => setTimeout(resolve, 3000))
    // Check Mailpit
    const mailpitResponse1 = await fetch(
      'http://127.0.0.1:54324/api/v1/messages'
    const mailpitData1 = await mailpitResponse1.json()
      `\n📬 Mailpit after invite: ${mailpitData1.total || 0} messages`
    if (mailpitData1.total > 0) {
      mailpitData1.messages.forEach((msg, _index) => {
          `${_index + 1}. ${msg.Subject} - To: ${msg.To?.[0]?.Address}`})} else {
      // Method 2: Try password reset method
        '\n🔄 Method 2: Using Auth Admin generateLink for password reset...'
      // First create a user
      const { _data: createUserData, _error: createUserError } =
        await _supabase.auth.admin.createUser({
          email: testEmail,
          email_confirm: false,
          user_metadata: {,
            role: full_name: 'Dennis Kiplangat'}})
      if (
        createUserError &&
        !createUserError.message.includes('already exists')
      ) {
      } else {
        // Generate password reset link
        const { _data: resetData, _error: resetError } =
          await _supabase.auth.admin.generateLink({
            type: 'recovery',
            email: testEmail,
            options: {
              redirectTo: 'http://localhost:5173/password-setup'}})
        if (resetError) {
        } else {
            '✅ Reset link generated:'
            resetData.properties.action_link
          // Wait and check again
          await new Promise(resolve => setTimeout(resolve, 3000))
          const mailpitResponse2 = await fetch(
            'http://127.0.0.1:54324/api/v1/messages'
          const mailpitData2 = await mailpitResponse2.json()
            `\n📬 Mailpit after reset: ${mailpitData2.total || 0} messages`
          if (mailpitData2.total > 0) {
            mailpitData2.messages.forEach((msg, _index) => {
                `${_index + 1}. ${msg.Subject} - To: ${msg.To?.[0]?.Address}`})} else {
              '\n🔍 This suggests Supabase Auth SMTP is still not configured correctly'
          }
        }
      }
    }
    // Final check of Mailpit status
    const mailpitInfo = await fetch('http://127.0.0.1:54324/api/v1/info')
    const infoData = await mailpitInfo.json()
  } catch (_error) {
  }
}
testSupabaseAuthEmail().catch(console._error)