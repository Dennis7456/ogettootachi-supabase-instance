// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
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
    // Get the request body
    const { token } = await req.json()

    if (!token) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No invitation token provided' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create a Supabase client with the service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('🔍 Looking up invitation with token:', token)

    // Find the invitation
    const { data: invitation, error: findError } = await supabaseClient
      .from('user_invitations')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single()

    if (findError || !invitation) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or expired invitation token' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invitation has expired' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Found valid invitation for:', invitation.email)

    // Find the user by email
    const { data: authUsers, error: authError } = await supabaseClient.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch users' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const user = authUsers.users.find(u => u.email === invitation.email)
    
    if (!user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User not found' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Found user:', user.id)

    // Update user email confirmation status
    const { error: updateAuthError } = await supabaseClient.auth.admin.updateUserById(user.id, {
      email_confirm: true
    })

    if (updateAuthError) {
      console.error('Error updating user auth:', updateAuthError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to confirm user email' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update profile
    const { error: updateProfileError } = await supabaseClient
      .from('profiles')
      .update({ 
        is_active: true
      })
      .eq('id', user.id)

    if (updateProfileError) {
      console.error('Error updating profile:', updateProfileError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to update user profile' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Mark invitation as accepted
    const { error: updateInvitationError } = await supabaseClient
      .from('user_invitations')
      .update({ 
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', invitation.id)

    if (updateInvitationError) {
      console.error('Error updating invitation:', updateInvitationError)
      // Don't fail the whole process if this fails
    }

    console.log('✅ Invitation confirmed successfully for:', invitation.email)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation confirmed successfully',
        user_id: user.id,
        email: invitation.email
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in confirm-invitation function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 