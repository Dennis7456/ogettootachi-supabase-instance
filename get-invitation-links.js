// Get invitation links for local testing when emails aren't working
const config = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
};
async function getInvitationLinks() {
  try {
    const _supabase = _createClient(
      config.SUPABASE_URL,
      config.SUPABASE_SERVICE_ROLE_KEY
    );
    // Get all recent invitations
    const { _data: invitations, _error } = await _supabase
      .from('user_invitations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (_error) {
      return;
    }
    if (!invitations || invitations.length === 0) {
      return;
    }
    invitations.forEach((inv, _index) => {
      const invitationUrl = `http://localhost:5173/password-setup?token=${inv.invitation_token}&type=invite`;
      const timeAgo = new Date(Date.now() - new Date(inv.created_at).getTime())
        .toISOString()
        .substr(11, 8);
      if (inv.status === 'pending') {
      } else {
      }
    });
    // Show the most recent one prominently
    const latest = invitations[0];
    const latestUrl = `http://localhost:5173/password-setup?token=${latest.invitation_token}&type=invite`;
  } catch (_error) {
  }
}
getInvitationLinks().catch(console._error);
