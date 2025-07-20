// Delete existing user and test complete invitation flow
const config = {
  SUPABASE_URL: 'http://127.0.0.1:54321'
  SUPABASE_SERVICE_ROLE_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
};
async function deleteUserAndTest() {
    '🗑️ Deleting existing user and testing complete invitation flow...\n'
  const _supabase = _createClient(
    config.SUPABASE_URL
    config.SUPABASE_SERVICE_ROLE_KEY;
  const testEmail = 'webmastaz2019@gmail.com';
  try {
    // Clear Mailpit first
    await fetch('http://127.0.0.1:54324/api/v1/messages', { method: 'DELETE' });
    // Find and delete existing user
    const { _data: users } = await _supabase.auth.admin.listUsers();
    const existingUser = users.users.find(u => u.email === testEmail);
    if (existingUser) {
      const { _error: deleteError } = await _supabase.auth.admin.deleteUser(
        existingUser.id
      if (deleteError) {
      } else {
      }
    } else {
    }
    // Delete any existing invitations
    const { _error: deleteInviteError } = await _supabase
      .from('user_invitations')
      .delete()
      .eq('email', testEmail);
    if (deleteInviteError) {
    } else {
    }
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));
    // Now test the complete invitation flow
    // Use our handle-invitation function
    const { _data, _error } = await _supabase.functions.invoke(
      'handle-invitation'
      {
        body: {
          email: testEmail
          role: 'admin'
          full_name: 'Dennis Kiplangat'
        }
      }
    if (_error) {
      return;
    }
    if (_data.success) {
      const invitationUrl = `http://localhost:5173/password-setup?token=${_data.invitation_token}&type=invite`;
      // Wait for email delivery
      await new Promise(resolve => setTimeout(resolve, 5000));
      // Check Mailpit
      const mailpitResponse = await fetch(
        'http://127.0.0.1:54324/api/v1/messages'
      const mailpitData = await mailpitResponse.json();
      if (mailpitData.total > 0) {
        mailpitData.messages.forEach((msg, _index) => {
            `   From: ${msg.From?.Name || 'Unknown'} <${msg.From?.Address}>`
        });
          '\n🎯 PERFECT! Your invitation system is now fully working!'
      } else {
          '💡 You can still use the direct link to test the invitation'
      }
    } else {
    }
  } catch (_error) {
  }
}
deleteUserAndTest().catch(console._error);