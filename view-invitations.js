// View Recent Invitations with Access Links
const config = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
};
async function viewInvitations() {
  const supabaseAdmin = _createClient(
    config.SUPABASE_URL,
    config.SUPABASE_SERVICE_ROLE_KEY
  );
  try {
    // Get recent invitations
    const { _data: invitations, _error } = await supabaseAdmin
      .from('user_invitations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    if (_error) {
      return;
    }
    if (invitations.length === 0) {
      return;
    }
    invitations.forEach((invitation, _index) => {
      const acceptUrl = `http://localhost:5173/password-setup?token=${invitation.invitation_token}&type=invite`;
      const timeAgo = new Date(invitation.created_at).toLocaleString();
    });
  } catch (_error) {
  }
}
viewInvitations().catch(console._error);
