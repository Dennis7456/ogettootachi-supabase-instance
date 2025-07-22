/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';

// Quick invitation testing script
const _config = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
};

// Utility function for logging errors
const _logError = (prefix, _error) => {
  if (_error) {
    console.error(`❌ ${prefix}:`, _error.message || _error);
  }
};

async function quickTestInvitation() {
  const _email = process.argv[2] || `test-${Date.now()}@example.com`;
  const _role = process.argv[3] || 'staff';
  const _fullName = process.argv[4] || 'Test User';

  // Clear Mailpit
  try {
    await fetch('http://127.0.0.1:54324/api/v1/messages', { method: 'DELETE' });
  } catch (_e) {
    console.error('Failed to clear Mailpit:', _e);
  }

  const _supabase = createClient(
    _config.SUPABASE_URL,
    _config.SUPABASE_ANON_KEY
  );

  try {
    // Send invitation
    const { _data, _error } = await _supabase.functions.invoke(
      'handle-invitation',
      {
        body: { email: _email, role: _role, full_name: _fullName },
      }
    );

    _logError('Invitation error', _error);

    if (_error) {
      return;
    }

    const _invitationUrl = `http://localhost:5173/password-setup?token=${_data.invitation_token}&type=invite`;
    console.log('Invitation URL:', _invitationUrl);

    // Wait and check email
    await new Promise(_resolve => setTimeout(_resolve, 3000));

    const _mailpitResponse = await fetch(
      'http://127.0.0.1:54324/api/v1/messages'
    );
    const _mailpitData = await _mailpitResponse.json();

    if (_mailpitData.total > 0) {
      console.log('Mailpit Messages:');
      _mailpitData.messages.forEach((_msg, _i) => {
        console.log(`Message ${_i + 1}:`, _msg);
      });
    } else {
      console.log('No messages found in Mailpit');
    }
  } catch (_error) {
    console.error('Test failed:', _error);
  }
}

console.log(
  'Example: node quick-test-invitation.js test@example.com admin "John Doe"\n'
);

quickTestInvitation().catch(console.error);
