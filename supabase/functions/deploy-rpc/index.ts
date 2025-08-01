// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

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
    
    // Execute the SQL directly using the service role
    const { data, error } = await supabaseClient.rpc('exec_sql', { sql: functionSQL });
    
    if (error) {
      console.error('❌ Error deploying function:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    console.log('✅ Function deployed successfully');
    
    // Test the function
    console.log('🧪 Testing the deployed function...');
    const { data: testResult, error: testError } = await supabaseClient.rpc('check_admin_exists');
    
    if (testError) {
      console.error('❌ Function test failed:', testError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Function deployed but test failed: ' + testError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    console.log('✅ Function test successful:', testResult);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Function deployed and tested successfully',
        testResult 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in deploy-rpc function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 