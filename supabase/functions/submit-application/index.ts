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

    // Get job details for email
    const { data: jobData, error: jobError } = await supabaseClient
      .from('job_postings')
      .select('title, department, location')
      .eq('id', job_id)
      .single()

    if (jobError) {
      console.error('Error fetching job details:', jobError)
    }

    // Send confirmation email to applicant
    try {
      const emailResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-application-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: applicant_email,
            subject: 'Application Received - Ogetto Otachi Advocates',
            template: 'application-received',
            templateData: {
              applicant_name: applicant_name,
              job_title: jobData?.title || 'Job Position',
              department: jobData?.department || 'Legal',
              location: jobData?.location || 'Nairobi',
              application_id: data,
              application_date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            }
          })
        }
      )

      if (!emailResponse.ok) {
        console.error('Failed to send confirmation email:', await emailResponse.text())
      } else {
        console.log('Confirmation email sent successfully to:', applicant_email)
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError)
    }

    // Send notification email to admin (optional)
    try {
      const adminEmailResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-application-email`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: 'admin@ogettootachi.com', // Replace with actual admin email
            subject: `New Job Application - ${jobData?.title || 'Job Position'}`,
            template: 'admin-application-notification',
            templateData: {
              applicant_name: applicant_name,
              applicant_email: applicant_email,
              applicant_phone: applicant_phone,
              job_title: jobData?.title || 'Job Position',
              department: jobData?.department || 'Legal',
              application_id: data,
              application_date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })
            }
          })
        }
      )

      if (!adminEmailResponse.ok) {
        console.error('Failed to send admin notification email:', await adminEmailResponse.text())
      } else {
        console.log('Admin notification email sent successfully')
      }
    } catch (adminEmailError) {
      console.error('Error sending admin notification email:', adminEmailError)
    }

    return new Response(
      JSON.stringify({ 
        data: { id: data },
        message: 'Application submitted successfully',
        email_sent: true
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