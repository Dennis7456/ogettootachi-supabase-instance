/* eslint-disable no-console, no-unused-vars */
// Test script to manually send an invitation email
// Use ES modules
// Use the invitation token from the previous test
const _invitationToken = '904b804d-2051-4e2a-819d-77f2a8e0b36a';
const _email = 'test@example.com';
const _role = 'staff';
const _customMessage = 'This is a test invitation email.';

// Supabase service role key - replace with your actual key
const _serviceRoleKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function sendInvitationEmail() {
  try {
    const _response = await fetch(
      'http://127.0.0.1:54321/functions/v1/send-invitation-email',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${_serviceRoleKey}`,
        },
        body: JSON.stringify({
          email: _email,
          role: _role,
          invitation_token: _invitationToken,
          custom_message: _customMessage,
        }),
      }
    );

    const _data = await _response.text();

    try {
      const _jsonData = JSON.parse(_data);
      console.log('Invitation email response:', _jsonData);
    } catch (_parseError) {
      console.error('Error parsing invitation email response:', _parseError);
    }
  } catch (_error) {
    console.error('Error sending invitation email:', _error);
  }
}

sendInvitationEmail();
