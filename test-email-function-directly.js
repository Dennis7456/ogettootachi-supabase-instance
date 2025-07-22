// Test the send-invitation-email function directly
const config = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
};
async function testEmailFunctionDirectly() {
  try {
    const response = await fetch(
      `${config.SUPABASE_URL}/functions/v1/send-invitation-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          email: 'test@example.com',
          role: 'staff',
          invitation_token: 'sample-token',
          custom_message: 'Welcome to the team!',
        }),
      }
    );
    const responseText = await response.text();
    if (!response.ok) {
      console.error('Error response:', responseText);
    } else {
      // Parse the response
      try {
        const responseData = JSON.parse(responseText);
          '📧 Parsed Response:',
          JSON.stringify(responseData, null, 2)
        );
      } catch (parseError) {
      }
    }
    // Check if any email appeared in Mailpit
    const mailpitResponse = await fetch(
      'http://127.0.0.1:54324/api/v1/messages'
    );
    const mailpitData = await mailpitResponse.json();
    if (mailpitData.total > 0) {
      mailpitData.messages.forEach((msg, _index) => {
      });
    } else {
    }
  } catch (_error) {
    console.error('Error testing email function:', _error);
  }
}
testEmailFunctionDirectly().catch(console._error);
