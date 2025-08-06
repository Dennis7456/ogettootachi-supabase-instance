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
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get query parameters
    const url = new URL(req.url)
    const jobId = url.searchParams.get('job_id')
    const daysBack = parseInt(url.searchParams.get('days_back') || '30')
    const analyticsType = url.searchParams.get('type') || 'summary'

    if (!jobId && analyticsType !== 'overall') {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: job_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let analyticsData

    if (analyticsType === 'overall') {
      // Get overall careers analytics
      const { data, error } = await supabase.rpc('get_careers_analytics', {
        days_back: daysBack
      })

      if (error) {
        console.error('Error getting careers analytics:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to get careers analytics' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      analyticsData = data
    } else {
      // Get job-specific analytics
      const { data, error } = await supabase.rpc('get_job_analytics_summary', {
        job_id: jobId,
        days_back: daysBack
      })

      if (error) {
        console.error('Error getting job analytics:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to get job analytics' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      analyticsData = data
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: analyticsData,
        type: analyticsType,
        days_back: daysBack
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in get-job-analytics:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 