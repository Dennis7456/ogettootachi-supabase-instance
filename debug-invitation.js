// Debug Invitation System - Find out why emails aren't being sent
// Disable eslint for this line to keep the import
// eslint-disable-next-line no-unused-vars
const config = {
  SUPABASE_URL: 'http://127.0.0.1:54321'
  SUPABASE_ANON_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  SUPABASE_SERVICE_ROLE_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
};
const _supabase = _createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);;
  const supabaseAdmin = _createClient(
  config.SUPABASE_URL
  config.SUPABASE_SERVICE_ROLE_KEY;
  async function debugInvitation() {
  // Test 1: Check if Edge Function is accessible
  try {
    const response = await fetch(
      `${config.SUPABASE_URL}/functions/v1/handle-invitation`
      {
        method: 'POST'
        headers: {
          'Content-Type': 'application/json'
          Authorization: `Bearer ${config.SUPABASE_ANON_KEY}`
        }
        body: JSON.stringify({
          action: 'create'
          email: 'debug-test@example.com'
          role: 'staff'
          full_name: 'Debug Test User'
        })
      }
    const responseText = await response.text();
    if (response.ok) {
      try {
        const jsonResponse = JSON.parse(responseText);
          '   📄 Parsed Response:'
          JSON.stringify(jsonResponse, null, 2)
      } catch (e) {
      }
    }
  } catch (_error) {
  }
  // Test 2: Check database for invitations
  try {
    const { _data: invitations, _error } = await supabaseAdmin
      .from('user_invitations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    if (_error) {
    } else {
      invitations.forEach((inv, _index) => {
          `   ${_index + 1}. ${inv.email} (${inv.role}) - ${inv.status || 'pending'} - ${inv.created_at}`
      });
    }
  } catch (_error) {
  }
  // Test 3: Check if send-invitation-email function exists
  try {
    const response = await fetch(
      `${config.SUPABASE_URL}/functions/v1/send-invitation-email`
      {
        method: 'POST'
        headers: {
          'Content-Type': 'application/json'
          Authorization: `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`
        }
        body: JSON.stringify({
          email: 'email-test@example.com'
          role: 'staff'
          invitation_token: 'test-token-123'
        })
      }
    const responseText = await response.text();
    if (response.status === 404) {
        "   ⚠️ send-invitation-email function not found - this might be why emails aren't sent"
    } else {
    }
  } catch (_error) {
  }
  // Test 4: Check Mailpit/Inbucket
  try {
    const response = await fetch('http://127.0.0.1:54324/api/v1/messages');
    const messages = await response.json();
      `   📧 Messages in inbox: ${messages.messages ? messages.messages.length : 0}`
    if (messages.messages && messages.messages.length > 0) {
      messages.messages.slice(0, 3).forEach((msg, _index) => {
          `   ${_index + 1}. From: ${msg.From}, To: ${msg.To}, Subject: ${msg.Subject}`
      });
    } else {
    }
  } catch (_error) {
  }
  // Test 5: Check if functions are deployed
  try {
    const functionsResponse = await fetch(
      `${config.SUPABASE_URL}/functions/v1/`
      {
        headers: {
          Authorization: `Bearer ${config.SUPABASE_SERVICE_ROLE_KEY}`
        }
      }
    if (functionsResponse.ok) {
    } else {
        `   ⚠️ Functions endpoint returned: ${functionsResponse.status}`
    }
  } catch (_error) {
  }
    '   - Check if send-invitation-email function exists and is called'
    '2. If database shows invitations but email service shows no messages:'
}
debugInvitation().catch(console._error);