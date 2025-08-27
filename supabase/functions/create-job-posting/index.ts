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

    // Get request body
    const body = await req.json()
    const {
      title,
      description,
      requirements,
      benefits,
      department,
      location,
      employment_type = 'full-time',
      experience_level = 'mid',
      salary_range,
      application_deadline,
      status = 'draft'
    } = body

    // Validate required fields
    if (!title || !description) {
      throw new Error('Title and description are required')
    }

    // Call the database function
    const { data, error } = await supabaseClient.rpc('create_job_posting', {
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

    return withCorsJson({ 
      data: { id: data },
      message: 'Job posting created successfully' 
    }, 201, req)

  } catch (error) {
    return withCorsJson({ error: error.message }, 400, req)
  }
}) 