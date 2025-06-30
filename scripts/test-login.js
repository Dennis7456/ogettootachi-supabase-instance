import { createClient } from '@supabase/supabase-js';

// Test login functionality
const supabaseUrl = 'https://riuqslalytzybvgsebki.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpdXFzbGFseXR6eWJ2Z3NlYmtpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3MzA0MDAsImV4cCI6MjA2NjMwNjQwMH0.SLbk4MgmS-DMpgCrHZOme9zolF_17SqvCFoKdgJtZWI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  const testEmail = 'webmastaz2019@gmail.com';
  const testPassword = 'testpassword123'; // This will fail, but we'll see the specific error
  
  try {
    console.log(`Testing login for: ${testEmail}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (error) {
      console.log('❌ Login failed');
      console.log('Error code:', error.status);
      console.log('Error message:', error.message);
      
      // Check specific error types
      if (error.message.includes('Invalid login credentials')) {
        console.log('🔍 This means either:');
        console.log('   - User does not exist');
        console.log('   - Password is incorrect');
        console.log('   - Email is not confirmed');
      } else if (error.message.includes('Email not confirmed')) {
        console.log('🔍 Email needs to be confirmed');
      } else if (error.message.includes('User not found')) {
        console.log('🔍 User does not exist in the database');
      }
    } else {
      console.log('✅ Login successful');
      console.log('User:', data.user.email);
      console.log('Session:', data.session ? 'Active' : 'None');
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testLogin(); 