import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://szbjuskqrfthmjehknly.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Ymp1c2txcmZ0aG1qZWhrbmx5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQzNTg5OSwiZXhwIjoyMDY5MDExODk5fQ.cMrSpRsKWhU0OM9wpRtrhOFj-6HHzS-lVOJ91YCnepU';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deployCheckAdminFunction() {
  try {
    console.log('🔧 Deploying check_admin_exists function...');
    
    const functionSQL = `
      CREATE OR REPLACE FUNCTION public.check_admin_exists()
      RETURNS boolean
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $function$
      DECLARE
        admin_count INTEGER;
      BEGIN
        -- Check if any user with role 'admin' exists in the profiles table
        SELECT COUNT(*) INTO admin_count
        FROM profiles
        WHERE role = 'admin';
        
        -- Return true if at least one admin exists, false otherwise
        RETURN admin_count > 0;
      END;
      $function$;
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', { sql: functionSQL });
    
    if (error) {
      console.error('❌ Error deploying function:', error);
      
      // Try alternative approach using direct SQL
      console.log('🔄 Trying alternative deployment method...');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey
        },
        body: JSON.stringify({ sql: functionSQL })
      });
      
      if (response.ok) {
        console.log('✅ Function deployed successfully via REST API');
      } else {
        const errorData = await response.text();
        console.error('❌ REST API deployment failed:', errorData);
      }
    } else {
      console.log('✅ Function deployed successfully');
    }
    
    // Test the function
    console.log('🧪 Testing the deployed function...');
    const { data: testResult, error: testError } = await supabase.rpc('check_admin_exists');
    
    if (testError) {
      console.error('❌ Function test failed:', testError);
    } else {
      console.log('✅ Function test successful:', testResult);
    }
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
  }
}

deployCheckAdminFunction(); 