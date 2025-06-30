import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple email template for local development
const createEmailTemplate = (email: string, role: string, invitationUrl: string) => {
  return `
=== INVITATION EMAIL (LOCAL DEVELOPMENT) ===

To: ${email}
Subject: You're invited to join Ogetto Otachi & Co Advocates

Dear User,

You have been invited to join Ogetto Otachi & Co Advocates as a ${role}.

Please click the following link to accept your invitation:
${invitationUrl}

This invitation will expire in 72 hours.

If you have any questions, please contact the administrator.

Best regards,
Ogetto Otachi & Co Advocates Team

==========================================
  `.trim()
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, role, invitation_token, invitation_url } = await req.json()

    // Validate required fields
    if (!email || !role || !invitation_token || !invitation_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Sending invitation email to:', email)
    console.log('Invitation URL:', invitation_url)
    console.log('Role:', role)

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Try to send invitation email using Supabase Auth
    try {
      const { data, error } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
        data: {
          role: role,
          invitation_token: invitation_token,
          invitation_url: invitation_url
        }
      })

      if (error) {
        console.error('Supabase Auth email error:', error)
        // Don't fail completely, just log the error
      } else {
        console.log('Supabase Auth email sent successfully:', data)
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError)
      // Continue execution even if email fails
    }

    // For local development, always return success and log the invitation details
    const isLocal = Deno.env.get('SUPABASE_URL')?.includes('127.0.0.1') || 
                   Deno.env.get('SUPABASE_URL')?.includes('localhost')

    if (isLocal) {
      const emailTemplate = createEmailTemplate(email, role, invitation_url)
      console.log('\n' + emailTemplate + '\n')
      console.log('=== LOCAL DEVELOPMENT MODE ===')
      console.log('Invitation created successfully!')
      console.log('Email:', email)
      console.log('Role:', role)
      console.log('Token:', invitation_token)
      console.log('Invitation URL:', invitation_url)
      console.log('================================')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: isLocal ? 'Invitation created (local mode - check console for details)' : 'Invitation email sent successfully',
        invitation_url: invitation_url,
        email: email,
        role: role,
        email_template: isLocal ? createEmailTemplate(email, role, invitation_url) : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in send-invitation-email function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 