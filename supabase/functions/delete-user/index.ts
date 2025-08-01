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
    console.log('🔍 /functions/v1/delete-user called');
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
    const { userId, userEmail } = await req.json()
    console.log('🔍 User ID to delete:', userId);
    console.log('🔍 User email to delete:', userEmail);

    if (!userId) {
      console.log('❌ No user ID provided');
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.log('❌ Invalid user ID format:', userId);
      return new Response(
        JSON.stringify({ error: 'Invalid user ID format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔍 Step 1: Deleting from profiles table...');
    
    // Delete from profiles table
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', userId);

    console.log('📡 Profiles delete response data:', profileData);
    console.log('📡 Profiles delete response error:', profileError);

    if (profileError) {
      console.error('❌ Profiles delete error:', profileError);
      return new Response(
        JSON.stringify({ 
          error: 'Error deleting from profiles table',
          details: profileError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ User deleted from profiles table successfully');

    // Delete from auth.users table
    console.log('🔍 Step 2: Deleting from auth.users table...');
    
    const { error: authError } = await supabaseClient.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('❌ Auth delete error:', authError);
      return new Response(
        JSON.stringify({ 
          error: 'Error deleting from auth.users table',
          details: authError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ User deleted from auth.users table successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User deleted successfully',
        userId: userId
      }),
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