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
    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No authorization header provided' 
        }),
        { 
          status: 401, 
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

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''))
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or expired token' 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized: Admin access required' 
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('🔄 Starting email synchronization...')

    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabaseClient.auth.admin.listUsers()
    
    if (authError) {
      console.error('Error fetching auth users:', authError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch users from auth' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, email')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to fetch profiles' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let updatedCount = 0
    const errors = []

    // Process each auth user
    for (const authUser of authUsers.users) {
      try {
        // Find corresponding profile
        const profile = profiles.find(p => p.id === authUser.id)
        
        if (profile) {
          // Check if email needs updating
          if (profile.email !== authUser.email) {
            const { error: updateError } = await supabaseClient
              .from('profiles')
              .update({ email: authUser.email })
              .eq('id', authUser.id)

            if (updateError) {
              console.error(`Error updating profile for user ${authUser.id}:`, updateError)
              errors.push(`Failed to update profile for ${authUser.email}`)
            } else {
              updatedCount++
              console.log(`✅ Updated email for user ${authUser.email}`)
            }
          }
        } else {
          // Profile doesn't exist, create it
          const { error: insertError } = await supabaseClient
            .from('profiles')
            .insert({
              id: authUser.id,
              email: authUser.email,
              full_name: authUser.user_metadata?.full_name || authUser.email,
              role: authUser.user_metadata?.role || 'staff',
              is_active: authUser.email_confirmed_at ? true : false,
              email_confirmed: !!authUser.email_confirmed_at
            })

          if (insertError) {
            console.error(`Error creating profile for user ${authUser.id}:`, insertError)
            errors.push(`Failed to create profile for ${authUser.email}`)
          } else {
            updatedCount++
            console.log(`✅ Created profile for user ${authUser.email}`)
          }
        }
      } catch (error) {
        console.error(`Error processing user ${authUser.id}:`, error)
        errors.push(`Failed to process ${authUser.email}`)
      }
    }

    console.log(`🔄 Email sync completed. Updated ${updatedCount} profiles.`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email synchronization completed',
        updatedCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in sync-user-emails function:', error)
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