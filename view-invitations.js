/* eslint-disable no-console, no-undef, no-unused-vars */
import { createClient } from '@supabase/supabase-js';

// View Recent Invitations with Access Links
const _config = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
};

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

async function viewInvitations() {
  const _supabaseAdmin = createClient(
    _config.SUPABASE_URL,
    _config.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get recent invitations
    const { _data: _invitations, _error } = await _supabaseAdmin
      .from('user_invitations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    _logError('Fetch invitations error', _error);

    if (!_invitations || _invitations.length === 0) {
      console.log('No invitations found.');
      return;
    }

    _invitations.forEach((_invitation, _index) => {
      const _acceptUrl = `http://localhost:5173/password-setup?token=${_invitation.invitation_token}&type=invite`;
      const _timeAgo = new Date(_invitation.created_at).toLocaleString();

      console.log(`Invitation ${_index + 1}:`, {
        acceptUrl: _acceptUrl,
        timeAgo: _timeAgo,
        details: _invitation,
      });
    });
  } catch (_error) {
    console.error('Error viewing invitations:', _error);
  }
}

viewInvitations().catch(console.error);
