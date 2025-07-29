import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Generate a random confirmation code
function generateConfirmationCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function testAppointmentWithNewFields() {
  console.log('Testing appointments with new fields...');

  try {
    // Test: Insert appointment data with new fields
    const appointmentData = {
      client_name: 'Test Client With New Fields',
      client_email: 'test.new@example.com',
      client_phone: '+254711222333',
      practice_area: 'Corporate Law',
      preferred_date: new Date().toISOString().split('T')[0],
      preferred_time: '11:30 AM',
      message: 'This is a test appointment with new fields',
      status: 'pending',
      appointment_type: 'Document Review',
      location: 'Nairobi Office',
      duration: 90,
      confirmation_code: generateConfirmationCode(),
    };
    
    console.log('Inserting test appointment data with new fields:', appointmentData);
    
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointmentData)
      .select();
    
    if (error) {
      console.error('❌ Appointment insert failed:', error);
    } else {
      console.log('✅ Appointment insert successful:', data);
    }

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testAppointmentWithNewFields(); 