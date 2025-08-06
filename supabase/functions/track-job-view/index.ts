import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TrackJobViewData {
  job_id: string;
  viewer_ip?: string;
  viewer_user_agent?: string;
  viewer_referrer?: string;
  session_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the request body
    const { job_id, viewer_ip, viewer_user_agent, viewer_referrer, session_id }: TrackJobViewData = await req.json()

    if (!job_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: job_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get client IP from request headers
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    viewer_ip || 
                    'unknown'

    // Get user agent from request headers
    const userAgent = req.headers.get('user-agent') || viewer_user_agent || 'unknown'

    // Get referrer from request headers
    const referrer = req.headers.get('referer') || viewer_referrer || 'direct'

    // Generate session ID if not provided
    const sessionId = session_id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Track the job view using database function
    const { data, error } = await supabase.rpc('track_job_view', {
      job_id: job_id,
      viewer_ip: clientIP,
      viewer_user_agent: userAgent,
      viewer_referrer: referrer,
      session_id: sessionId
    })

    if (error) {
      console.error('Error tracking job view:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to track job view' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Job view tracked successfully',
        job_id,
        session_id: sessionId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in track-job-view:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 