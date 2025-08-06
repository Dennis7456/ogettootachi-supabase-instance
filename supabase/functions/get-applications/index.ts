import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('🔍 Edge Function: Request received', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔍 Edge Function: Creating Supabase client');
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get query parameters
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const jobId = url.searchParams.get('job_id')
    const status = url.searchParams.get('status')
    
    console.log('🔍 Edge Function: Query parameters:', { limit, offset, jobId, status });

    // Call the database function
    console.log('Calling get_applications with params:', {
      limit_count: limit,
      offset_count: offset,
      job_id_filter: jobId,
      status_filter: status
    })
    
    const { data, error } = await supabaseClient.rpc('get_applications', {
      limit_count: limit,
      offset_count: offset,
      job_id_filter: jobId,
      status_filter: status
    })

    if (error) {
      console.error('Database function error:', error)
      throw error
    }
    
    console.log('Database function result:', { data, count: data?.length || 0 })

    return new Response(
      JSON.stringify({ data, count: data?.length || 0 }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('🔍 Edge Function: Error caught:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 