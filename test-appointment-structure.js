const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://szbjuskqrfthmjehknly.supabase.co';
// You need to replace this with your actual anon key from your frontend .env file
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Ymp1c2txcmZ0aG1qZWhrbmx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NzI5NzQsImV4cCI6MjA0NzU0ODk3NH0.YOUR_ACTUAL_KEY_HERE';

console.log('⚠️  Please replace the supabaseKey with your actual anon key from your frontend .env file');
console.log('   You can find it in: ogetto-otachi-frontend/.env or ogetto-otachi-frontend/.env.local');
console.log('   Look for VITE_SUPABASE_ANON_KEY=...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAppointmentStructure() {
  try {
    console.log('🔍 Testing appointments table structure...');
    
    // Test 1: Check if we can select from appointments table
    console.log('\n1. Testing basic SELECT...');
    const { data: selectData, error: selectError } = await supabase
      .from('appointments')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ SELECT error:', selectError);
      if (selectError.message.includes('Invalid API key')) {
        console.log('\n💡 To fix this:');
        console.log('1. Check your frontend .env file for VITE_SUPABASE_ANON_KEY');
        console.log('2. Copy that value and replace the supabaseKey in this script');
        console.log('3. Run this test again');
      }
      return;
    } else {
      console.log('✅ SELECT works, found', selectData?.length || 0, 'records');
      if (selectData && selectData.length > 0) {
        console.log('Sample record keys:', Object.keys(selectData[0]));
      }
    }
    
    // Test 2: Try to insert a test appointment without appointment_type
    console.log('\n2. Testing INSERT without appointment_type...');
    const testAppointment = {
      client_name: 'Test User',
      client_email: 'test@example.com',
      client_phone: '1234567890',
      practice_area: 'Test Area',
      preferred_date: '2024-12-01',
      preferred_time: '10:00 AM',
      message: 'Test appointment',
      status: 'pending'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('appointments')
      .insert(testAppointment)
      .select();
    
    if (insertError) {
      console.error('❌ INSERT error:', insertError);
    } else {
      console.log('✅ INSERT without appointment_type works');
      console.log('Inserted record:', insertData);
      
      // Clean up - delete the test record
      if (insertData && insertData.length > 0) {
        const { error: deleteError } = await supabase
          .from('appointments')
          .delete()
          .eq('id', insertData[0].id);
        
        if (deleteError) {
          console.error('⚠️ Could not delete test record:', deleteError);
        } else {
          console.log('✅ Test record cleaned up');
        }
      }
    }
    
    // Test 3: Try to insert with appointment_type
    console.log('\n3. Testing INSERT with appointment_type...');
    const testAppointmentWithType = {
      ...testAppointment,
      appointment_type: 'Initial Consultation'
    };
    
    const { data: insertWithTypeData, error: insertWithTypeError } = await supabase
      .from('appointments')
      .insert(testAppointmentWithType)
      .select();
    
    if (insertWithTypeError) {
      console.error('❌ INSERT with appointment_type error:', insertWithTypeError);
    } else {
      console.log('✅ INSERT with appointment_type works');
      console.log('Inserted record with type:', insertWithTypeData);
      
      // Clean up - delete the test record
      if (insertWithTypeData && insertWithTypeData.length > 0) {
        const { error: deleteError } = await supabase
          .from('appointments')
          .delete()
          .eq('id', insertWithTypeData[0].id);
        
        if (deleteError) {
          console.error('⚠️ Could not delete test record:', deleteError);
        } else {
          console.log('✅ Test record with type cleaned up');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAppointmentStructure();
