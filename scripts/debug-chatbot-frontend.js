import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://localhost:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugChatbotFrontend() {
  console.log('=== Debugging Frontend Chatbot Issue ===\n');

  try {
    // Test 1: Check if user is authenticated
    console.log('1️⃣ Checking authentication status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError.message);
    } else if (user) {
      console.log('✅ User is authenticated:', user.id);
      console.log('   Email:', user.email);
    } else {
      console.log('⚠️  No user authenticated - this might be the issue!');
    }

    // Test 2: Try calling chatbot without authentication
    console.log('\n2️⃣ Testing chatbot without authentication...');
    const testMessage = "Tell me about your practice areas";
    
    try {
      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: {
          message: testMessage,
          session_id: `debug-test-${Date.now()}`
        }
      });

      if (error) {
        console.error('❌ Chatbot error:', error.message);
        console.error('   Error details:', error);
      } else {
        console.log('✅ Chatbot responded successfully:');
        console.log('   Response:', data.response.substring(0, 150) + '...');
        console.log('   Documents used:', data.documents?.length || 0);
      }
    } catch (error) {
      console.error('❌ Function call failed:', error.message);
      console.error('   Error details:', error);
    }

    // Test 3: Check if we can access the function at all
    console.log('\n3️⃣ Testing function accessibility...');
    try {
      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: {
          message: "test",
          session_id: "test"
        }
      });

      if (error) {
        console.error('❌ Function not accessible:', error.message);
      } else {
        console.log('✅ Function is accessible');
      }
    } catch (error) {
      console.error('❌ Function call exception:', error.message);
    }

    // Test 4: Check Supabase connection
    console.log('\n4️⃣ Testing Supabase connection...');
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Database connection error:', error.message);
      } else {
        console.log('✅ Database connection works');
      }
    } catch (error) {
      console.error('❌ Database connection exception:', error.message);
    }

    console.log('\n🔍 Debug Summary:');
    console.log('   - Check if the user is properly authenticated in the frontend');
    console.log('   - Verify the Supabase client is configured correctly');
    console.log('   - Check browser console for any JavaScript errors');
    console.log('   - Ensure the chatbot component is using the correct Supabase client');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Error details:', error);
  }
}

// Run the debug
debugChatbotFrontend(); 