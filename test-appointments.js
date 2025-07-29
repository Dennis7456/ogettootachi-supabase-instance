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

async function testAppointments() {
  console.log('Testing appointments table...');

  try {
    // Test: Insert appointment data
    const appointmentData = {
      client_name: 'Test Client',
      client_email: 'test@example.com',
      client_phone: '+254700000000',
      practice_area: 'Corporate Law',
      preferred_date: new Date().toISOString().split('T')[0],
      preferred_time: '10:00 AM',
      message: 'This is a test appointment',
      status: 'pending',
    };
    
    console.log('Inserting test appointment data:', appointmentData);
    
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

testAppointments(); 