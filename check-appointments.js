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

async function checkAppointments() {
  console.log('Checking recent appointments...');

  try {
    // Get the most recent appointments
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching appointments:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log(`✅ Found ${data.length} appointments:`);
      
      // Display appointments in a nicely formatted table
      console.table(data.map(appointment => ({
        id: appointment.id,
        client_name: appointment.client_name,
        client_email: appointment.client_email,
        practice_area: appointment.practice_area,
        preferred_date: appointment.preferred_date,
        preferred_time: appointment.preferred_time,
        status: appointment.status,
        created_at: new Date(appointment.created_at).toLocaleString()
      })));
    } else {
      console.log('❌ No appointments found');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAppointments(); 