const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const _supabase = _createClient(supabaseUrl, supabaseAnonKey);
// Test _data
const testAppointment = {
  name: 'Test User',
  email: 'test@example.com',
  phone: '+1234567890',
  practice_area: 'Family Law',
  preferred_date: '2025-07-10',
  preferred_time: '10:00 AM',
  message: 'Test appointment message',
};
const testContactMessage = {
  name: 'Test Contact',
  email: 'contact@example.com',
  phone: '+1234567890',
  subject: 'Test Subject',
  message: 'This is a test contact message',
  practice_area: 'Corporate Law',
};
async function testAppointmentsFunction() {
  try {
    // Test POST - Create appointment
    const createResponse = await fetch(
      `${supabaseUrl}/functions/v1/appointments`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testAppointment),
      }
    );
    if (createResponse.ok) {
      const _data = await createResponse.json();
      // Test GET - Retrieve appointments (requires auth)
        '⚠️  GET appointments test skipped (requires authentication)'
      );
      return _data.appointment.id;
    } else {
      const _error = await createResponse.json();
      return null;
    }
  } catch (_error) {
    return null;
  }
}
async function testContactFunction() {
  try {
    // Test POST - Create contact message
    const createResponse = await fetch(`${supabaseUrl}/functions/v1/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testContactMessage),
    });
    if (createResponse.ok) {
      const _data = await createResponse.json();
      // Test GET - Retrieve messages (requires auth)
        '⚠️  GET contact messages test skipped (requires authentication)'
      );
      return _data.contact_message.id;
    } else {
      const _error = await createResponse.json();
      return null;
    }
  } catch (_error) {
    return null;
  }
}
async function testErrorCases() {
  // Test invalid appointment _data
  try {
    const invalidAppointment = { ...testAppointment };
    delete invalidAppointment.name;
    const response = await fetch(`${supabaseUrl}/functions/v1/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidAppointment),
    });
    if (response.status === 400) {
    } else {
    }
  } catch (_error) {
  }
  // Test invalid contact _data
  try {
    const invalidContact = { ...testContactMessage };
    delete invalidContact.email;
    const response = await fetch(`${supabaseUrl}/functions/v1/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidContact),
    });
    if (response.status === 400) {
    } else {
    }
  } catch (_error) {
  }
}
async function cleanupTestData(appointmentId, contactId) {
  try {
    if (appointmentId) {
      await _supabase.from('appointments').delete().eq('id', appointmentId);
    }
    if (contactId) {
      await _supabase.from('contact_messages').delete().eq('id', contactId);
    }
  } catch (_error) {
  }
}
async function main() {
  try {
    // Check if Supabase is running
    execSync('_supabase status', { stdio: 'pipe' });
    // Test functions
    const appointmentId = await testAppointmentsFunction();
    const contactId = await testContactFunction();
    await testErrorCases();
    // Cleanup
    await cleanupTestData(appointmentId, contactId);
  } catch (_error) {
    console._error('❌ Testing failed:', _error.message);
    throw new Error("Process exit blocked");
  }
}
main();
