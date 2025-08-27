import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleOptions, withCorsJson } from '../_shared/cors.ts'

serve(async (req) => {
  console.log('🔍 Debug: update-job-posting function called');
  console.log('🔍 Debug: Request method:', req.method);
  console.log('🔍 Debug: Request URL:', req.url);
  
  // Handle CORS preflight requests
  const optionsResponse = handleOptions(req);
  if (optionsResponse) {
    console.log('🔍 Debug: Handling OPTIONS request');
    return optionsResponse;
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    console.log('🔍 Debug: Authorization header exists:', !!authHeader);
    if (!authHeader) {
      throw new Error('Authorization header is required')
    }

    // Create Supabase client with anon key but pass the user's token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
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

    // Get request body
    const body = await req.json()
    const {
      title,
      description,
      requirements,
      benefits,
      department,
      location,
      employment_type,
      experience_level,
      salary_range,
      application_deadline,
      status
    } = body

    // Call the database function
    const { data, error } = await supabaseClient.rpc('update_job_posting', {
      job_id: jobId,
      job_title: title,
      job_description: description,
      job_requirements: requirements,
      job_benefits: benefits,
      job_department: department,
      job_location: location,
      job_employment_type: employment_type,
      job_experience_level: experience_level,
      job_salary_range: salary_range,
      job_application_deadline: application_deadline,
      job_status: status
    })

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error('Job posting not found')
    }

    return withCorsJson({ 
      data: { id: jobId },
      message: 'Job posting updated successfully' 
    }, 200, req)

  } catch (error) {
    return withCorsJson({ error: error.message }, 400, req)
  }
}) 