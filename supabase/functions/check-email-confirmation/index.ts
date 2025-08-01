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
    console.log('🔍 /functions/v1/check-email-confirmation called');
    console.log('🔍 Request method:', req.method);

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

    // Get the request body
    const { emails } = await req.json()
    console.log('🔍 Emails received:', emails);

    if (!Array.isArray(emails) || emails.length === 0) {
      console.log('❌ Invalid emails array:', emails);
      return new Response(
        JSON.stringify({ error: 'Array of emails is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Limit the number of emails to prevent abuse
    const MAX_EMAILS = 50;
    if (emails.length > MAX_EMAILS) {
      console.log('❌ Too many emails requested:', emails.length);
      return new Response(
        JSON.stringify({ error: `Too many emails. Maximum allowed: ${MAX_EMAILS}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔍 Querying auth.users table for', emails.length, 'emails');
    
    // Get users from auth.users table (admin only)
    // Note: We need to use the service role key to access auth.users
    const { data: authUsers, error } = await supabaseClient.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ Error fetching users:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Error fetching user data',
          details: error.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Auth users query successful');
    console.log('✅ Number of auth users found:', authUsers?.users?.length || 0);

    // Filter users by the requested emails
    const filteredUsers = authUsers.users.filter(user => emails.includes(user.email));

    // Create a map of email to confirmation status for easy lookup
    const emailStatusMap = {};
    filteredUsers.forEach(user => {
      console.log('📧 Processing auth user:', user.email);
      console.log('📧 Email confirmed at:', user.email_confirmed_at);
      console.log('📧 Email confirmed (boolean):', user.email_confirmed_at !== null);
      
      emailStatusMap[user.email] = {
        email_confirmed: user.email_confirmed_at !== null,
        email_confirmed_at: user.email_confirmed_at
      };
    });

    console.log('📊 Email status map created:', emailStatusMap);

    // Prepare the response with all requested emails
    const result = emails.map(email => {
      const status = emailStatusMap[email] || {
        email_confirmed: false,
        email_confirmed_at: null,
        error: 'User not found'
      };
      
      console.log('📧 Final result for email:', email);
      console.log('📧 Status:', status);
      
      return {
        email,
        ...status
      };
    });

    console.log('✅ Final result array:', result);
    console.log('✅ Number of results:', result.length);
    
    // Log summary
    const confirmedCount = result.filter(r => r.email_confirmed === true).length;
    const pendingCount = result.filter(r => r.email_confirmed === false).length;
    const notFoundCount = result.filter(r => r.error === 'User not found').length;
    
    console.log('📊 Email confirmation summary:');
    console.log('📊 - Confirmed:', confirmedCount);
    console.log('📊 - Pending:', pendingCount);
    console.log('📊 - Not found:', notFoundCount);

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Server error:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 