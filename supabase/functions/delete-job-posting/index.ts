import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, withCorsJson } from '../_shared/cors.ts'

serve(async (req) => {
  console.log('🔍 Debug: delete-job-posting function called');
  console.log('🔍 Debug: Request method:', req.method);
  console.log('🔍 Debug: Request URL:', req.url);
  
  // Handle CORS preflight requests
  const optionsResponse = handleOptions(req);
  if (optionsResponse) {
    console.log('🔍 Debug: Handling OPTIONS request');
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
    console.log('🔍 Debug: Job ID from URL:', jobId);

    if (!jobId) {
      throw new Error('Job ID is required')
    }

    // Call the database function
    console.log('🔍 Debug: Calling delete_job_posting with job_id:', jobId);
    const { data, error } = await supabaseClient.rpc('delete_job_posting', {
      job_id: jobId
    })

    if (error) {
      console.log('🔍 Debug: Database function error:', error);
      throw error
    }

    console.log('🔍 Debug: Database function result:', data);
    if (!data) {
      throw new Error('Job posting not found')
    }

    console.log('🔍 Debug: Returning success response');
    return withCorsJson({ 
      data: { id: jobId },
      message: 'Job posting deleted successfully' 
    }, 200, req)

  } catch (error) {
    return withCorsJson({ error: error.message }, 400, req)
  }
}) 