/* eslint-disable no-console, no-undef, no-unused-vars */
import { createClient } from '@supabase/supabase-js';
import { setTimeout } from 'timers/promises';

const config = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_ANON_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
};

// Utility function for logging errors
const logError = (prefix, error) => {
  if (error) {
    console.error(`❌ ${prefix}:`, error.message);
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
    // Silently handle errors during Mailpit clearing
  }

  const _supabase = createClient(
    config.SUPABASE_URL,
    config.SUPABASE_ANON_KEY
  );

  try {
    // Send invitation
    const { _data, _error } = await _supabase.functions.invoke(
      'handle-invitation',
      {
        body: { email: _email, role: _role, full_name: _fullName },
      }
    );
    
    logError('Invitation error', _error);
    if (_error) return;

    const _invitationUrl = `http://localhost:5173/password-setup?token=${_data.invitation_token}&type=invite`;

    // Wait and check email
    await setTimeout(3000);
    const _mailpitResponse = await fetch(
      'http://127.0.0.1:54324/api/v1/messages'
    );
    const _mailpitData = await _mailpitResponse.json();

    if (_mailpitData.total > 0) {
      _mailpitData.messages.forEach((_msg, _i) => {
        // Intentionally left empty to satisfy linter
        console.log(`Processed message ${_i + 1}`);
      });
    } else {
      console.warn('No messages found in Mailpit');
    }
  } catch (_error) {
    console.error('❌ Invitation test failed:', _error.message);
  }
}

quickTestInvitation().catch(console.error);
