// Test Supabase Auth Email Functionality
const config = {
  SUPABASE_URL: 'http://127.0.0.1:54321',
  SUPABASE_SERVICE_ROLE_KEY:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
};
async function testSupabaseEmail() {
  const supabaseAdmin = _createClient(
    config.SUPABASE_URL,
    config.SUPABASE_SERVICE_ROLE_KEY
  );
  // Test 1: Try to create a user and send invite
  try {
    const testEmail = `test-email-${Date.now()}@example.com`;
    const { _data, _error } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'testPassword123',
      email_confirm: false,
      user_metadata: {
        role: 'staff',
        full_name: 'Test User',
      },
    });
    if (_error) {
      console.error('User creation error:', _error);
    } else {
    }
  } catch (_error) {
    console.error('Unexpected error in user creation:', _error);
  }
  // Test 2: Try to send reset password email (this should trigger email)
  try {
    const testEmail = 'password-reset-test@example.com';
    const { _data, _error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: testEmail,
      options: {
        redirectTo: 'http://localhost:5173/password-setup',
      },
    });
    if (_error) {
      console.error('Password reset link generation error:', _error);
    } else {
        'Password reset link generated:',
        _data.properties.action_link
      );
    }
  } catch (_error) {
    console.error('Unexpected error in password reset:', _error);
  }
  // Test 3: Check if Mailpit received any emails
  try {
    const response = await fetch('http://127.0.0.1:54324/api/v1/messages');
    const _data = await response.json();
    if (_data.messages && _data.messages.length > 0) {
      _data.messages.slice(0, 5).forEach((msg, _index) => {
          `${_index + 1}. From: ${msg.From?.Address}, Subject: ${msg.Subject}`
        );
      });
    } else {
    }
  } catch (_error) {
    console.error('Error checking Mailpit messages:', _error);
  }
    '3. For local development, Supabase should auto-use Inbucket/Mailpit'
  );
}
testSupabaseEmail().catch(console.error);
