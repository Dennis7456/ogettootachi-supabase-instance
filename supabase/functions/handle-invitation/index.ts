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
    const { email, role, full_name } = await req.json()

    // Validate required fields
    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: 'Email and role are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Processing invitation for:', email, 'Role:', role)

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate a unique invitation token
    const invitationToken = crypto.randomUUID()
    
    // Create the invitation URL that will redirect to password setup
    const baseUrl = Deno.env.get('FRONTEND_URL') || 'https://ogetto-otachi-law-firm.web.app'
    const invitationUrl = `${baseUrl}/password-setup?token=${invitationToken}&type=invite`

    try {
      // Send invitation email using Supabase Auth
      const { data, error } = await supabaseClient.auth.admin.inviteUserByEmail(email, {
        data: {
          role: role,
          full_name: full_name || '',
          invitation_token: invitationToken
        },
        redirectTo: invitationUrl
      })

      if (error) {
        console.error('Supabase Auth invitation error:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('Invitation sent successfully:', data)

      // Store invitation details in database for tracking
      const { error: dbError } = await supabaseClient
        .from('user_invitations')
        .insert({
          email: email,
          role: role,
          full_name: full_name || '',
          invitation_token: invitationToken,
          status: 'sent',
          expires_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() // 72 hours
        })

      if (dbError) {
        console.error('Database error:', dbError)
        // Don't fail the request, just log the error
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Invitation sent successfully',
          invitation_url: invitationUrl,
          email: email,
          role: role
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )

    } catch (invitationError) {
      console.error('Invitation error:', invitationError)
      return new Response(
        JSON.stringify({ error: 'Failed to send invitation' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

  } catch (error) {
    console.error('Error in handle-invitation function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 