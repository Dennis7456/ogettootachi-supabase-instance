/* eslint-disable no-console, no-unused-vars */
const _config = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
};

async function testEmailFunctionDirectly() {
  try {
    const _response = await fetch(`${_config.SUPABASE_URL}/functions/v1/send-invitation-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${_config.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        email: 'test@example.com',
        role: 'staff',
        invitation_token: 'sample-token',
        custom_message: 'Welcome to the team!',
      }),
    });

    const _responseText = await _response.text();

    if (!_response.ok) {
      console.error('Error response:', _responseText);
      return;
    }

    // Parse the response
    try {
      const _responseData = JSON.parse(_responseText);
      console.log('📧 Parsed Response:', JSON.stringify(_responseData, null, 2));
    } catch (_parseError) {
      console.error('Error parsing response:', _parseError);
    }

    // Check if any email appeared in Mailpit
    const _mailpitResponse = await fetch('http://127.0.0.1:54324/api/v1/messages');
    const _mailpitData = await _mailpitResponse.json();

    if (_mailpitData.total > 0) {
      _mailpitData.messages.forEach((_msg, _index) => {
        console.log(`Email message ${_index + 1}:`, _msg);
      });
    } else {
      console.log('No emails found in Mailpit');
    }
  } catch (_error) {
    console.error('Error testing email function:', _error);
  }
}

testEmailFunctionDirectly().catch(console.error);
