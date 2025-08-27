import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, withCorsJson } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  const optionsResponse = handleOptions(req);
  if (optionsResponse) {
    return optionsResponse;
  }

  try {
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

    // Get job ID from URL
    const url = new URL(req.url)
    const jobId = url.searchParams.get('id')

    if (!jobId) {
      throw new Error('Job ID is required')
    }

    // Call the database function to update status to active
    const { data, error } = await supabaseClient.rpc('update_job_posting', {
      job_id: jobId,
      job_status: 'active'
    })

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error('Job posting not found')
    }

    return withCorsJson({ 
      data: { id: jobId },
      message: 'Job posting published successfully' 
    }, 200, req)

  } catch (error) {
    return withCorsJson({ error: error.message }, 400, req)
  }
}) 