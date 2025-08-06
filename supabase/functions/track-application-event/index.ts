import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TrackApplicationEventData {
  job_id: string;
  event_type: 'view' | 'apply_click' | 'form_start' | 'form_complete' | 'file_upload' | 'submission' | 'admin_review' | 'status_update';
  application_id?: string;
  event_data?: Record<string, any>;
  user_ip?: string;
  user_agent?: string;
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
    const { 
      job_id, 
      event_type, 
      application_id, 
      event_data, 
      user_ip, 
      user_agent, 
      session_id 
    }: TrackApplicationEventData = await req.json()

    if (!job_id || !event_type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: job_id, event_type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate event type
    const validEventTypes = ['view', 'apply_click', 'form_start', 'form_complete', 'file_upload', 'submission', 'admin_review', 'status_update']
    if (!validEventTypes.includes(event_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid event_type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get client IP from request headers
    const clientIP = req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    user_ip || 
                    'unknown'

    // Get user agent from request headers
    const userAgent = req.headers.get('user-agent') || user_agent || 'unknown'

    // Generate session ID if not provided
    const sessionId = session_id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Track the application event using database function
    const { data, error } = await supabase.rpc('track_application_event', {
      job_id: job_id,
      event_type: event_type,
      application_id: application_id,
      event_data: event_data,
      user_ip: clientIP,
      user_agent: userAgent,
      session_id: sessionId
    })

    if (error) {
      console.error('Error tracking application event:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to track application event' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Application event tracked successfully',
        job_id,
        event_type,
        session_id: sessionId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in track-application-event:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 