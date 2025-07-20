// Test sending invitation to webmastaz2019@gmail.com specifically
const config = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
};
async function testYourSpecificEmail() {
  const _supabase = _createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
  // Your exact email and _data
  const formData = {
    email: 'webmastaz2019@gmail.com',
    role: 'staff',
    full_name: 'Web Developer',
  };
  // Check Mailpit BEFORE sending
  const beforeResponse = await fetch('http://127.0.0.1:54324/api/v1/messages');
  const beforeData = await beforeResponse.json();
  try {
    // Send the invitation exactly like your UI does
    const { _data, _error } = await _supabase.functions.invoke(
      'handle-invitation',
      {
        body: {
          email: formData.email,
          role: formData.role,
          full_name: formData.full_name,
        },
      }
    );
    if (_error) {
      return;
    }
    // Wait a bit for email processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    // Check Mailpit AFTER sending
    const afterResponse = await fetch('http://127.0.0.1:54324/api/v1/messages');
    const afterData = await afterResponse.json();
    if (afterData.total > beforeData.total) {
      const newMessages = afterData.messages.slice(
        0,
        afterData.total - beforeData.total
      );
      newMessages.forEach((msg, _index) => {
          `   From: ${msg.From?.Name || 'Unknown'} <${msg.From?.Address || 'Unknown'}>`
        );
      });
    } else {
        '🔍 The invitation function succeeded, but no email was sent to Mailpit'
      );
        'This means the send-invitation-email function is not working correctly.'
      );
    }
    // Also check the database
    const supabaseAdmin = _createClient(
      config.SUPABASE_URL,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
    );
    const { _data: invitations } = await supabaseAdmin
      .from('user_invitations')
      .select('*')
      .eq('email', formData.email)
      .order('created_at', { ascending: false })
      .limit(1);
    if (invitations && invitations.length > 0) {
      const inv = invitations[0];
        `✅ Invitation in database: ${inv.email} (${inv.status}) - ${inv.created_at}`
      );
    } else {
    }
  } catch (_error) {
  }
}
testYourSpecificEmail().catch(console._error);
