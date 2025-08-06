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
      is_public,
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
      job_is_public: is_public,
      job_status: status
    })

    if (error) {
      throw error
    }

    if (!data) {
      throw new Error('Job posting not found')
    }

    return new Response(
      JSON.stringify({ 
        data: { id: jobId },
        message: 'Job posting updated successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
}) 