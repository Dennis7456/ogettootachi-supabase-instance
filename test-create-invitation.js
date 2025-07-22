/* eslint-disable no-console, no-unused-vars */
// Invitation data
const _invitationData = {
  email: 'new-test@example.com',
  role: 'staff',
  full_name: 'New Test User',
  department: 'Legal',
  custom_message: 'This is a test invitation with automatic email sending.',
};

// Supabase service role key
const _serviceRoleKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

async function createInvitation() {
  try {
    const _response = await fetch('http://127.0.0.1:54321/functions/v1/handle-invitation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${_serviceRoleKey}`,
      },
      body: JSON.stringify(_invitationData),
    });

    const _data = await _response.text();

    try {
      const _jsonData = JSON.parse(_data);
      console.log('Invitation response:', _jsonData);
    } catch (_parseError) {
      console.error('Error parsing invitation response:', _parseError);
    }
  } catch (_error) {
    console.error('Error creating invitation:', _error);
  }
}

createInvitation();
