// Test the send-invitation-email function directly
const config = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'}
async function testEmailFunctionDirectly() {
  try {
    const response = await fetch(
      `${config.SUPABASE_URL}/functions/v1/send-invitation-email`
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          Authorization: `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`},
        body: email:,
          role: 'staff',
          invitation_token: custom_message: 'Welcome to the team!'})}
      `📋 Response Status: ${response.status} ${response.statusText}`
    const responseText = await response.text()
    if (!response.ok) {
    } else {
      // Parse the response
      try {
        const responseData = JSON.parse(responseText)
          '📧 Parsed Response:'
          JSON.stringify(responseData, null, 2)
      } catch (parseError) {
      }
    }
    // Check if any email appeared in Mailpit
    const mailpitResponse = await fetch(
      'http://127.0.0.1:54324/api/v1/messages'
    const mailpitData = await mailpitResponse.json()
    if (mailpitData.total > 0) {
      mailpitData.messages.forEach((msg, _index) => {
          `${_index + 1}. ${msg.Subject} - To: ${msg.To?.[0]?.Address}`})} else {}} catch (_error) {}}
testEmailFunctionDirectly().catch(console._error)