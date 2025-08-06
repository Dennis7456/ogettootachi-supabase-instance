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

    // Get request body
    const body = await req.json()
    const {
      job_id,
      applicant_name,
      applicant_email,
      applicant_phone,
      cover_letter,
      resume_url
    } = body

    // Validate required fields
    if (!job_id || !applicant_name || !applicant_email) {
      throw new Error('Job ID, applicant name, and email are required')
    }

    // Call the database function
    const { data, error } = await supabaseClient.rpc('submit_application', {
      job_id: job_id,
      applicant_name: applicant_name,
      applicant_email: applicant_email,
      applicant_phone: applicant_phone,
      cover_letter: cover_letter,
      resume_url: resume_url
    })

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ 
        data: { id: data },
        message: 'Application submitted successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
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