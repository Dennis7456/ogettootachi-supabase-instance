import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    console.log('🧪 Test Edge Function called');
    
    // Log environment variables
    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasServiceRoleKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      hasMailjetKey: !!Deno.env.get('MAILJET_API_KEY'),
      hasMailjetSecret: !!Deno.env.get('MAILJET_API_SECRET'),
    });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test Edge Function is working',
        timestamp: new Date().toISOString(),
        env: {
          hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
          hasServiceRoleKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
          hasMailjetKey: !!Deno.env.get('MAILJET_API_KEY'),
          hasMailjetSecret: !!Deno.env.get('MAILJET_API_SECRET'),
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('❌ Test Edge Function error:', error);
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
})
