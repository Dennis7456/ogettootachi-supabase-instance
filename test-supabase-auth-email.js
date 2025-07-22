/* eslint-disable no-console, no-undef */
import { createClient } from '@supabase/supabase-js';

// Test Supabase Auth email sending with corrected SMTP configuration
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

async function testSupabaseAuthEmail() {
  console.log(
    '🧪 Testing Supabase Auth email with corrected SMTP configuration...\n'
  );

  // Clear Mailpit first
  try {
    await fetch('http://127.0.0.1:54324/api/v1/messages', { method: 'DELETE' });
  } catch (_e) {
    console.warn('Failed to clear Mailpit messages');
  }

  const _supabase = createClient(
    _config.SUPABASE_URL,
    _config.SUPABASE_SERVICE_ROLE_KEY
  );

  const _testEmail = 'webmastaz2019@gmail.com';

  try {
    // Method 1: Try the invitation method
    const { _data: _inviteData, _error: _inviteError } =
      await _supabase.auth.admin.inviteUserByEmail(_testEmail, {
        data: {
          role: '',
          full_name: 'Dennis Kiplangat',
        },
        redirectTo: 'http://localhost:5173/password-setup',
      });

    _logError('Invite error', _inviteError);

    // Wait for email
    await new Promise((_resolve) => setTimeout(_resolve, 3000));

    // Check Mailpit
    const _mailpitResponse1 = await fetch(
      'http://127.0.0.1:54324/api/v1/messages'
    );
    const _mailpitData1 = await _mailpitResponse1.json();

    if (_mailpitData1.total > 0) {
      _mailpitData1.messages.forEach((_msg, _index) => {
        console.log(`Mailpit Message ${_index + 1}:`, _msg);
      });
    } else {
      console.log(
        '\n🔄 Method 2: Using Auth Admin generateLink for password reset...'
      );

      // First create a user
      const { _data: _createUserData, _error: _createUserError } =
        await _supabase.auth.admin.createUser({
          email: _testEmail,
          email_confirm: false,
          user_metadata: {
            role: '',
            full_name: 'Dennis Kiplangat',
          },
        });

      _logError('Create user error', _createUserError);

      if (
        !_createUserError ||
        _createUserError.message.includes('already exists')
      ) {
        // Generate password reset link
        const { _data: _resetData, _error: _resetError } =
          await _supabase.auth.admin.generateLink({
            type: 'recovery',
            email: _testEmail,
            options: {
              redirectTo: 'http://localhost:5173/password-setup',
            },
          });

        _logError('Reset link error', _resetError);

        if (_resetData) {
          console.log(
            '✅ Reset link generated:',
            _resetData.properties.action_link
          );

          // Wait and check again
          await new Promise((_resolve) => setTimeout(_resolve, 3000));

          const _mailpitResponse2 = await fetch(
            'http://127.0.0.1:54324/api/v1/messages'
          );
          const _mailpitData2 = await _mailpitResponse2.json();

          if (_mailpitData2.total > 0) {
            _mailpitData2.messages.forEach((_msg, _index) => {
              console.log(`Mailpit Message ${_index + 1}:`, _msg);
            });
          } else {
            console.log(
              '\n🔍 This suggests Supabase Auth SMTP is still not configured correctly'
            );
          }
        }
      }
    }

    // Final check of Mailpit status
    const _mailpitInfo = await fetch('http://127.0.0.1:54324/api/v1/info');
    const _infoData = await _mailpitInfo.json();
    console.log('Mailpit Info:', _infoData);
  } catch (_error) {
    console.error('Unexpected error:', _error);
  }
}

testSupabaseAuthEmail().catch(console.error);
