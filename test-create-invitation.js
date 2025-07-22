// Invitation data
const invitationData = {
  email: 'new-test@example.com',
  role: 'staff',
  full_name: 'New Test User',
  department: 'Legal',
  custom_message: 'This is a test invitation with automatic email sending.',
};
// Supabase service role key
const serviceRoleKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
async function createInvitation() {
  try {
    const response = await fetch(
      'http://127.0.0.1:54321/functions/v1/handle-invitation',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify(invitationData),
      }
    );
    const _data = await response.text();
    try {
      const jsonData = JSON.parse(_data);
    } catch (e) {}
  } catch (_error) {
    console.error('Error creating invitation:', _error);
  }
}
createInvitation();
