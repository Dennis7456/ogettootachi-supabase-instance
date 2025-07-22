// Test with fresh email to avoid "user already exists" issue
const config = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
};
async function testFreshEmail() {
  // Clear Mailpit first
  try {
    await fetch('http://127.0.0.1:54324/api/v1/messages', { method: 'DELETE' });
  } catch (e) {}
  const _supabase = _createClient(
    config.SUPABASE_URL,
    config.SUPABASE_SERVICE_ROLE_KEY
  );
  const freshEmail = `test-${Date.now()}@freshtest.com`;
  try {
    // Test invitation method with fresh email
    const { _data: inviteData, _error: inviteError } =
      await _supabase.auth.admin.inviteUserByEmail(freshEmail, {
        _data: {
          role: 'staff',
          full_name: 'Fresh Test User',
        },
        redirectTo: 'http://localhost:5173/password-setup',
      });
    if (inviteError) {
      console.error('Invitation error:', inviteError);
    } else {
    }
    // Wait for email
    await new Promise(resolve => setTimeout(resolve, 5000));
    // Check Mailpit
    const mailpitResponse = await fetch(
      'http://127.0.0.1:54324/api/v1/messages'
    );
    const mailpitData = await mailpitResponse.json();
    if (mailpitData.total > 0) {
      mailpitData.messages.forEach((msg, _index) => {
      });
        '\n🎯 SUCCESS! Supabase Auth is now sending emails to Mailpit!'
      );
    } else {
      // Check Mailpit stats to see what happened
      const mailpitInfo = await fetch('http://127.0.0.1:54324/api/v1/info');
      const infoData = await mailpitInfo.json();
      if (infoData.SMTPAccepted > 0) {
          '\n🔍 Emails were accepted by SMTP but not stored - this might be a Mailpit issue'
        );
      } else {
          '\n🔍 No SMTP connections were made - Supabase Auth is not using our SMTP config'
        );
      }
    }
  } catch (_error) {
    console.error('Error in fresh email test:', _error);
  }
}
testFreshEmail().catch(console.error);
