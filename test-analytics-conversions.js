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

async function testAnalyticsConversions() {
  console.log('Testing analytics_conversions table...');

  try {
    // Test: Insert conversion data
    const conversionData = {
      session_id: 'test-session-' + Date.now(),
      event_type: 'button_click',
      event_data: { button_id: 'contact_submit', page_section: 'contact_form' },
      page_url: '/contact',
      timestamp: new Date().toISOString(),
    };
    
    console.log('Inserting test conversion data:', conversionData);
    
    const { data, error } = await supabase
      .from('analytics_conversions')
      .insert(conversionData)
      .select();
    
    if (error) {
      console.error('❌ Conversion insert failed:', error);
    } else {
      console.log('✅ Conversion insert successful:', data);
    }

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

testAnalyticsConversions(); 