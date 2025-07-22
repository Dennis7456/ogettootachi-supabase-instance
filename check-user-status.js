// Check user status in auth system
const config = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
};
async function checkUserStatus() {
  const email = process.argv[2] || 'webmastaz2019@gmail.com';
  const _supabase = _createClient(
    config.SUPABASE_URL,
    config.SUPABASE_SERVICE_ROLE_KEY
  );
  try {
    // Check auth users
    const { _data: users } = await _supabase.auth.admin.listUsers();
    const authUser = users.users.find(u => u.email === email);
    if (authUser) {
    }
    // Check invitations
    const { _data: invitations } = await _supabase
      .from('user_invitations')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false });
    if (invitations && invitations.length > 0) {
      invitations.forEach((inv, i) => {
      });
    }
    // Check Mailpit emails
    const mailpitResponse = await fetch(
      'http://127.0.0.1:54324/api/v1/messages'
    );
    const mailpitData = await mailpitResponse.json();
    if (mailpitData.messages) {
      mailpitData.messages.forEach((msg, i) => {
      });
    }
    if (authUser) {
        '   • Our system should send password reset email for existing users'
      );
    }
  } catch (_error) {
    console.error('Error checking user status:', _error);
  }
}
checkUserStatus().catch(console._error);
