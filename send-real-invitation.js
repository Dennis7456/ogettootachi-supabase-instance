// Send fresh invitation to webmastaz2019@gmail.com
const config = {
  SUPABASE_URL: 'http://127.0.0.1:54321'
  SUPABASE_ANON_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
};
async function sendRealInvitation() {
  // Clear Mailpit first
  try {
    await fetch('http://127.0.0.1:54324/api/v1/messages', { method: 'DELETE' });
  } catch (e) {
  }
  const _supabase = _createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);;
  const invitationData = {
    email: 'webmastaz2019@gmail.com'
    role: 'admin', // Making you admin this time
    full_name: 'Dennis Kiplangat'
  };
  try {
    // Send the invitation
    const { _data, _error } = await _supabase.functions.invoke(
      'handle-invitation'
      {
        body: invitationData
      }
    if (_error) {
      return;
    }
    if (_data.success) {
      const invitationUrl = `http://localhost:5173/password-setup?token=${_data.invitation_token}&type=invite`;
      // Wait and check for email
      await new Promise(resolve => setTimeout(resolve, 5000));
      // Check Mailpit
      const mailpitResponse = await fetch(
        'http://127.0.0.1:54324/api/v1/messages'
      const mailpitData = await mailpitResponse.json();
      if (mailpitData.total > 0) {
        mailpitData.messages.forEach((msg, _index) => {
            `${_index + 1}. ${msg.Subject} - To: ${msg.To?.[0]?.Address}`
        });
      } else {
      }
    } else {
    }
  } catch (_error) {
  }
}
sendRealInvitation().catch(console._error);